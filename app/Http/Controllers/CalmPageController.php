<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\NotificationTemplate;
use App\Models\SavedArticle;
use App\Support\CommunityVisibilityService;
use App\Support\MilestoneService;
use App\Support\NotificationDigestService;
use App\Support\NotificationService;
use App\Support\PsychologistBookingService;
use App\Support\UserAppointmentPresenter;
use App\Support\UserProfileBootstrapper;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CalmPageController extends Controller
{
    public function __construct(
        protected UserProfileBootstrapper $bootstrapper,
        protected NotificationService $notifications,
        protected NotificationDigestService $notificationDigest,
        protected MilestoneService $milestones,
        protected PsychologistBookingService $booking,
        protected UserAppointmentPresenter $appointmentPresenter,
        protected CommunityVisibilityService $communityVisibility,
    ) {
    }

    public function home(Request $request): Response
    {
        $notificationsEnabled = $request->user()
            ? (bool) ($request->user()->notifications_enabled ?? true)
            : (bool) $request->session()->get('notifications_enabled', true);

        $recommendedArticles = DB::table('articles')
            ->select('slug', 'title', 'minutes', 'body')
            ->where('is_recommended', 1)
            ->orderBy('id')
            ->limit(3)
            ->get()
            ->map(fn ($article) => [
                'slug' => $article->slug,
                'title' => $article->title,
                'minutes' => $this->estimateArticleReadingMinutesFromBody($article->body, $article->minutes),
            ]);
        $communityGroups = DB::table('community_groups')
            ->select('id', 'name')
            ->get();
        $lastMessageRows = DB::table('community_dialogue_messages as messages')
            ->join('community_dialogues as dialogues', 'dialogues.id', '=', 'messages.dialogue_id')
            ->select('dialogues.group_id', 'dialogues.stamp', 'messages.time', 'dialogues.sort_order', 'messages.sort_order as message_sort_order')
            ->orderBy('dialogues.group_id')
            ->orderBy('dialogues.sort_order')
            ->orderBy('messages.sort_order')
            ->get()
            ->groupBy('group_id');
        $feed = $notificationsEnabled
            ? collect($this->notifications->serializeFeed(
                $this->notifications->feedFor($request->user()?->id),
                []
            ))
            : collect();
        $latestNotification = $feed->first()
            ?: ($notificationsEnabled ? collect($this->notificationDigest->defaultGuestNotifications())->first() : null);

        return Inertia::render('Home', [
            'moodOptions' => DB::table('mood_options')->select('id', 'label', 'emoji')->orderBy('id')->get(),
            'faqs' => DB::table('faqs')->select('id', 'question', 'answer', 'link_href', 'link_text', 'link_hint')->orderBy('id')->get(),
            'recommendedArticles' => $recommendedArticles,
            'communityGroups' => $communityGroups
                ->map(function ($group) use ($lastMessageRows) {
                    $lastMessage = collect($lastMessageRows->get($group->id, []))->last();

                    return [
                        'name' => $group->name,
                        'lastMessageAt' => $this->communityMessageDateTime($lastMessage?->stamp, $lastMessage?->time)?->toIso8601String(),
                    ];
                })
                ->sortByDesc(fn ($group) => $group['lastMessageAt'] ?? '')
                ->take(3)
                ->values(),
            'latestNotification' => $latestNotification,
        ]);
    }

    public function learn(): Response
    {
        return Inertia::render('Learn', [
            'topics' => DB::table('article_topics as at')
                ->leftJoin('articles as a', 'a.topic_id', '=', 'at.id')
                ->leftJoin('articles_validation as av', 'av.article_id', '=', 'a.id')
                ->groupBy('at.id', 'at.name', 'at.slug')
                ->orderBy('at.id')
                ->selectRaw('at.id, at.name as title, at.slug, COUNT(CASE WHEN av.is_valid = 1 THEN a.id END) as articleCount')
                ->get(),
            'articles' => DB::table('articles as a')
                ->leftJoin('article_topics as at', 'at.id', '=', 'a.topic_id')
                ->leftJoin('articles_validation as av', 'av.article_id', '=', 'a.id')
                ->where('a.is_recommended', 1)
                ->where(function ($query) {
                    $query->whereNull('av.article_id')->orWhere('av.is_valid', 1);
                })
                ->orderBy('a.id')
                ->select('a.slug', 'a.title', 'a.tag', 'a.minutes', 'a.hero_image', 'a.body', 'at.name as category')
                ->get()
                ->map(fn ($article) => [
                    'slug' => $article->slug,
                    'title' => $article->title,
                    'tag' => $article->tag,
                    'category' => $article->category,
                    'minutes' => $this->estimateArticleReadingMinutesFromBody($article->body, $article->minutes),
                    'hero_image' => $article->hero_image,
                ]),
        ]);
    }

    public function learnCategory(string $slug): Response
    {
        $category = DB::table('article_topics as at')
            ->leftJoin('articles as a', 'a.topic_id', '=', 'at.id')
            ->leftJoin('articles_validation as av', 'av.article_id', '=', 'a.id')
            ->where('at.slug', $slug)
            ->groupBy('at.id', 'at.name', 'at.slug')
            ->selectRaw('at.id, at.name as title, at.slug, COUNT(CASE WHEN av.is_valid = 1 THEN a.id END) as articleCount')
            ->first();

        abort_unless($category, 404);

        $articles = DB::table('articles as a')
            ->leftJoin('article_topics as at', 'at.id', '=', 'a.topic_id')
            ->leftJoin('articles_validation as av', 'av.article_id', '=', 'a.id')
            ->where('a.topic_id', $category->id)
            ->where(function ($query) {
                $query->whereNull('av.article_id')->orWhere('av.is_valid', 1);
            })
            ->orderBy('a.id')
            ->get(['a.slug', 'a.title', 'a.tag', 'a.minutes', 'a.hero_image', 'a.body', 'at.name as category'])
            ->map(fn ($article) => [
                'slug' => $article->slug,
                'title' => $article->title,
                'tag' => $article->tag,
                'category' => $article->category,
                'minutes' => $this->estimateArticleReadingMinutesFromBody($article->body, $article->minutes),
                'hero_image' => $article->hero_image,
            ]);

        return Inertia::render('LearnCategory', [
            'category' => $category,
            'articles' => $articles,
        ]);
    }

    public function community(Request $request): Response
    {
        if ($request->user()) {
            $this->milestones->award($request->user()->id, 'first_community_access', 'community', 'listing');
        }

        $activePsychologistId = (int) (Auth::guard('psychologist')->id() ?? 0);
        $groups = $this->communityVisibility
            ->applyVisibleToPublicScope(DB::table('community_groups'), $activePsychologistId)
            ->select('community_groups.id', 'community_groups.slug', 'community_groups.name', 'community_groups.is_private', 'community_groups.author')
            ->get();
        $invitationCounts = DB::table('community_group_invitations')
            ->select('group_id', DB::raw('COUNT(*) as total'))
            ->groupBy('group_id')
            ->pluck('total', 'group_id');
        $messageRows = DB::table('community_dialogue_messages as messages')
            ->join('community_dialogues as dialogues', 'dialogues.id', '=', 'messages.dialogue_id')
            ->select(
                'dialogues.group_id',
                'dialogues.stamp',
                'messages.sender',
                'messages.role',
                'messages.time',
                'dialogues.sort_order as dialogue_sort_order',
                'messages.sort_order as message_sort_order'
            )
            ->orderBy('dialogues.group_id')
            ->orderBy('dialogues.sort_order')
            ->orderBy('messages.sort_order')
            ->get()
            ->groupBy('group_id');
        $groupStats = $groups->mapWithKeys(function ($group) use ($invitationCounts, $messageRows) {
            $rows = collect($messageRows->get($group->id, []))->values();
            $lastMessage = $rows->last();
            $lastMessageAt = $this->communityMessageDateTime($lastMessage?->stamp, $lastMessage?->time);
            $memberCount = $this->communityMemberCount((bool) $group->is_private, $group->id, $rows, $invitationCounts);

            return [
                $group->id => [
                    'memberCount' => $memberCount,
                    'memberLabel' => $this->communityMemberLabel($memberCount),
                    'lastMessageAt' => $lastMessageAt,
                    'lastActiveExact' => $this->communityExactElapsedLabel($lastMessageAt),
                ],
            ];
        });

        return Inertia::render('Community', [
            'groups' => $groups
                ->map(fn ($group) => [
                    'id' => $group->id,
                    'slug' => $group->slug ?? str($group->name)->slug()->toString(),
                    'name' => $group->name,
                    'memberCount' => $groupStats[$group->id]['memberCount'] ?? 0,
                    'memberLabel' => $groupStats[$group->id]['memberLabel'] ?? $this->communityMemberLabel(0),
                    'lastActiveExact' => $groupStats[$group->id]['lastActiveExact'] ?? 'fara mesaje',
                    'lastMessageAt' => $groupStats[$group->id]['lastMessageAt']?->toIso8601String(),
                    'is_private' => (bool) $group->is_private,
                    'canAccessConversations' => $this->canAccessCommunityGroupConversations($request, $group->id, (bool) $group->is_private, (int) ($group->author ?? 0)),
                    'isModerator' => $activePsychologistId > 0 && $activePsychologistId === (int) ($group->author ?? 0),
                ])
                ->sortByDesc(fn ($group) => $group['lastMessageAt'] ?? '')
                ->values(),
        ]);
    }

    public function communityGroup(Request $request, string $groupSlug): Response
    {
        $group = $this->communityGroupPayload($groupSlug);
        abort_unless($group, 404);
        $activePsychologistId = (int) (Auth::guard('psychologist')->id() ?? 0);

        return Inertia::render('CommunityGroup', [
            'group' => [
                ...$group,
                'canAccessConversations' => $this->canAccessCommunityGroupConversations($request, $group['id'], $group['isPrivate'], $group['authorId'] ?? null),
                'isModerator' => $activePsychologistId > 0 && $activePsychologistId === (int) ($group['authorId'] ?? 0),
            ],
        ]);
    }

    public function communityConversations(Request $request, string $groupSlug): Response
    {
        $group = $this->communityGroupPayload($groupSlug, true);
        abort_unless($group, 404);

        $activePsychologistId = (int) (Auth::guard('psychologist')->id() ?? 0);
        $isModerator = $activePsychologistId > 0 && $activePsychologistId === (int) ($group['authorId'] ?? 0);
        $canAccess = $this->canAccessCommunityGroupConversations($request, $group['id'], $group['isPrivate'], $group['authorId'] ?? null);

        return Inertia::render('CommunityConversations', [
            'group' => [
                ...$group,
                'canAccessConversations' => $canAccess,
                'isModerator' => $isModerator,
            ],
        ]);
    }

    public function storeCommunityConversationMessage(Request $request, string $groupSlug): JsonResponse
    {
        $group = $this->communityGroupPayload($groupSlug);
        abort_unless($group, 404);

        $activePsychologistId = (int) (Auth::guard('psychologist')->id() ?? 0);
        $isModerator = $activePsychologistId > 0 && $activePsychologistId === (int) ($group['authorId'] ?? 0);
        $user = $request->user();

        abort_unless($user || $isModerator, 401);
        abort_unless($this->canAccessCommunityGroupConversations($request, $group['id'], $group['isPrivate'], $group['authorId'] ?? null), 403);

        $validated = $request->validate([
            'text' => ['required', 'string', 'max:3000'],
            'reply_to' => ['nullable', 'string', 'max:160'],
        ]);

        $stamp = $this->communityDialogueStamp(now());
        $dialogueId = DB::table('community_dialogues')
            ->where('group_id', $group['id'])
            ->where('stamp', $stamp)
            ->value('id');

        if (! $dialogueId) {
            $nextSortOrder = (int) DB::table('community_dialogues')->where('group_id', $group['id'])->max('sort_order') + 1;
            $dialogueId = DB::table('community_dialogues')->insertGetId([
                'group_id' => $group['id'],
                'stamp' => $stamp,
                'sort_order' => $nextSortOrder,
            ]);
        }

        if ($isModerator) {
            $psychologist = DB::table('psychologists')
                ->where('id', $activePsychologistId)
                ->first(['title', 'name', 'surname']);
            $sender = trim(collect([$psychologist?->title, $psychologist?->name, $psychologist?->surname])->filter()->implode(' ')) ?: ($group['facilitator'] ?? 'Moderator');
            $role = 'facilitator';
        } else {
            $sender = trim(($user->first_name ? $user->first_name.' ' : '').($user->last_name ?: '')) ?: $user->name;
            $role = 'participant';
        }
        $sortOrder = (int) DB::table('community_dialogue_messages')->where('dialogue_id', $dialogueId)->max('sort_order') + 1;

        $messageId = DB::table('community_dialogue_messages')->insertGetId([
            'dialogue_id' => $dialogueId,
            'sender' => $sender,
            'role' => $role,
            'reply_to' => $validated['reply_to'] ?? null,
            'time' => now()->format('H:i'),
            'text' => $validated['text'],
            'sort_order' => $sortOrder,
        ]);

        if (! $group['isPrivate']) {
            $this->notifications->publishBroadcast('community_public_update', [
                'title' => 'Actualizare comunitate',
                'body' => "Activitate noua in {$group['name']}.",
                'category' => 'community',
                'icon' => 'FiUsers',
                'icon_color' => 'amber',
                'trigger_type' => 'community_group',
                'trigger_id' => (string) $group['id'],
                'dedupe_key' => "community_public_update:{$group['id']}:".now()->format('YmdH'),
                'expires_at' => now()->addDays(7),
                'cta_kind' => 'open',
                'cta_payload' => ['href' => "/community/{$group['slug']}", 'label' => 'Vezi comunitatea'],
            ]);
        } elseif ($user) {
            $this->notifications->publishToUser($user->id, 'community_member_update', [
                'title' => 'Activitate noua in comunitate',
                'body' => "Ai scris in {$group['name']}. Revino oricand pentru raspunsuri noi.",
                'category' => 'community',
                'icon' => 'FiHeart',
                'icon_color' => 'amber',
                'trigger_type' => 'community_message',
                'trigger_id' => (string) $messageId,
                'dedupe_key' => "community_message:{$user->id}:{$messageId}",
                'cta_kind' => 'open',
                'cta_payload' => ['href' => "/community/{$group['slug']}/conversatii", 'label' => 'Deschide conversatia'],
            ]);
        }

        return response()->json([
            'message' => [
                'id' => $messageId,
                'sender' => $sender,
                'role' => $role,
                'roleLabel' => $this->communityRoleLabel($role),
                'time' => now()->format('H:i'),
                'text' => $validated['text'],
                'replyTo' => $validated['reply_to'] ?? null,
                'stamp' => $stamp,
            ],
        ]);
    }

    public function communityConversationMessages(Request $request, string $groupSlug): JsonResponse
    {
        $group = $this->communityGroupPayload($groupSlug, true);
        abort_unless($group, 404);

        $activePsychologistId = (int) (Auth::guard('psychologist')->id() ?? 0);
        $isModerator = $activePsychologistId > 0 && $activePsychologistId === (int) ($group['authorId'] ?? 0);
        $user = $request->user();

        abort_unless($user || $isModerator, 401);
        abort_unless($this->canAccessCommunityGroupConversations($request, $group['id'], $group['isPrivate'], $group['authorId'] ?? null), 403);

        return response()->json([
            'dialogues' => $group['dialogues'] ?? [],
        ]);
    }

    public function notifications(Request $request): Response
    {
        $notificationsEnabled = $request->user()
            ? (bool) ($request->user()->notifications_enabled ?? true)
            : (bool) $request->session()->get('notifications_enabled', true);

        $notifications = $notificationsEnabled
            ? $this->notifications->serializeFeed(
                $this->notifications->feedFor($request->user()?->id),
                []
            )
            : [];

        return Inertia::render('Notifications', [
            'notifications' => $notifications,
            'guestDefaults' => $notificationsEnabled ? $this->notificationDigest->defaultGuestNotifications() : [],
            'unreadCount' => $notificationsEnabled ? $this->notifications->unreadCountFor($request->user()?->id) : 0,
            'notificationsEnabled' => $notificationsEnabled,
        ]);
    }

    public function profile(Request $request): Response
    {
        $user = $request->user();

        if ($user) {
            $this->bootstrapper->ensureForUser($user);
        }

        return Inertia::render('Profile', [
            'profile' => $user ? $this->profileRow($user->id) : null,
            'profileDetails' => $user ? $this->profileDetailsRow($user->id) : null,
            'stats' => $user ? DB::table('user_stats')->select('metric_key', 'label', 'value', 'tone', 'icon')->where('user_id', $user->id)->orderBy('sort_order')->orderBy('id')->get() : [],
            'milestones' => $user ? DB::table('user_milestones as um')
                ->join('milestone_templates as mt', 'mt.id', '=', 'um.template_id')
                ->where('um.user_id', $user->id)
                ->orderByDesc('um.achieved_at')
                ->select('um.id', 'mt.title', 'mt.description', 'mt.icon', 'mt.icon_color', 'mt.category', 'um.achieved_at')
                ->get() : [],
            'infoLinks' => DB::table('resource_templates')
                ->select('id', 'label')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn ($template) => [
                    'id' => 'template-'.$template->id,
                    'label' => $template->label,
                ]),
            'upcomingAppointments' => $user ? $this->appointmentPresenter->forUser($user->id) : [],
        ]);
    }

    public function settings(Request $request): Response
    {
        return Inertia::render('Settings', [
            'preferences' => [
                'theme' => $request->user()?->theme ?? $request->session()->get('theme', 'light'),
                'notifications_enabled' => $request->user()?->notifications_enabled ?? $request->session()->get('notifications_enabled', true),
                'language' => $request->user()?->language ?? $request->session()->get('language', 'Romana'),
            ],
            'userProfile' => $request->user() ? [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ] : config('calm.profile_demo'),
        ]);
    }

    public function legalPage(string $slug): Response
    {
        $pages = $this->legalPages();
        $page = $pages[$slug] ?? null;

        if (! $page) {
            throw new NotFoundHttpException();
        }

        return Inertia::render('Legal/Show', [
            'slug' => $slug,
            'eyebrow' => $page['eyebrow'] ?? 'Legal',
            'title' => $page['title'],
            'description' => $page['description'],
            'updatedAt' => $page['updatedAt'],
            'sections' => $page['sections'],
            'company' => $page['company'],
            'navItems' => $this->documentNavItems(includeHelp: true),
        ]);
    }

    public function help(): Response
    {
        return Inertia::render('Legal/Show', [
            'slug' => 'help',
            'eyebrow' => 'Help',
            'title' => 'Centru de ajutor',
            'description' => 'Intrebari si raspunsuri despre paginile, functionalitatile si avantajele principale ale aplicatiei Calming.',
            'updatedAt' => '28 martie 2026',
            'sections' => $this->helpSections(),
            'company' => null,
            'navItems' => $this->documentNavItems(includeHelp: true),
        ]);
    }

    public function technical(): Response
    {
        $page = $this->legalPages()['tehnic'];

        return Inertia::render('Legal/Show', [
            'slug' => 'tehnic',
            'eyebrow' => $page['eyebrow'] ?? 'Tehnic',
            'title' => $page['title'],
            'description' => $page['description'],
            'updatedAt' => $page['updatedAt'],
            'sections' => $page['sections'],
            'company' => $page['company'],
            'navItems' => $this->documentNavItems(includeHelp: true),
        ]);
    }

    public function favoriteArticles(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('FavoriteArticles', [
            'articles' => $user
                ? DB::table('saved_articles as sa')
                    ->join('articles as a', 'a.id', '=', 'sa.article_id')
                    ->leftJoin('psychologists as p', 'p.id', '=', 'a.author')
                    ->where('sa.user_id', $user->id)
                    ->where('sa.status', 'active')
                    ->orderByDesc('sa.saved_at')
                    ->select(
                        'a.id',
                        'a.slug',
                        'a.title',
                        'a.hero_image',
                        'sa.saved_at',
                        'p.title as author_title',
                        'p.name as author_name',
                        'p.surname as author_surname'
                    )
                    ->get()
                    ->map(fn ($article) => [
                        'id' => $article->id,
                        'slug' => $article->slug,
                        'title' => $article->title,
                        'hero_image' => $article->hero_image,
                        'saved_at' => $this->serializeDateValue($article->saved_at),
                        'author' => trim(collect([$article->author_title, $article->author_name, $article->author_surname])->filter()->implode(' ')) ?: 'Specialist Calming',
                    ])
                : [],
        ]);
    }

    public function assistant(Request $request): Response
    {
        if ($request->user()) {
            $this->milestones->award($request->user()->id, 'assistant_opened', 'assistant', 'page');
        }

        return Inertia::render('Assistant');
    }

    public function createAssistantArticlePage(): Response
    {
        return Inertia::render('AssistantArticleNew', [
            'topics' => $this->articleTopics(),
        ]);
    }

    public function storeAssistantArticle(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'author_name' => ['required', 'string', 'max:150'],
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['required', 'string', 'max:120'],
            'topic_id' => ['required', 'integer', 'exists:article_topics,id'],
            'body' => ['required', 'string'],
            'hero_image' => ['required', 'image', 'max:5120'],
        ]);

        $imagePath = $request->file('hero_image')->store('article-images', 'public');
        $slug = $this->uniqueArticleSlug($validated['title']);
        $minutes = $this->estimateArticleReadingMinutes($validated['body']);

        $articleId = DB::table('articles')->insertGetId([
            'title' => $validated['title'],
            'slug' => $slug,
            'tag' => $validated['tag'],
            'minutes' => $minutes,
            'hero_image' => Storage::disk('public')->url($imagePath),
            'author' => $this->encodeGuestArticleAuthor($validated['author_name']),
            'body' => json_encode($validated['body']),
            'is_recommended' => true,
            'topic_id' => $validated['topic_id'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('articles_validation')->updateOrInsert(
            ['article_id' => $articleId],
            ['is_valid' => true, 'validated_at' => now()]
        );

        $article = DB::table('articles')->where('id', $articleId)->first(['id', 'slug', 'title']);
        if ($article) {
            NotificationTemplate::query()->updateOrCreate(
                ['key' => 'article_published'],
                [
                    'audience' => 'general',
                    'actor_type' => 'both',
                    'category' => 'article',
                    'title' => 'Articol nou',
                    'message' => 'A aparut un articol nou in biblioteca Calming.',
                    'default_title' => 'Articol nou',
                    'default_body' => 'A aparut un articol nou in biblioteca Calming.',
                    'icon' => 'FiBookOpen',
                    'icon_color' => 'lilac',
                    'accent' => 'lilac',
                    'priority' => 3,
                    'cta_kind' => 'open',
                    'cta_label' => 'Citeste acum',
                    'deep_link' => '/learn',
                    'is_repeatable' => true,
                    'published_at' => now(),
                ]
            );

            $this->notifications->publishBroadcast('article_published', [
                'title' => 'Articol nou in biblioteca',
                'body' => $article->title,
                'trigger_type' => 'article',
                'trigger_id' => (string) $article->id,
                'dedupe_key' => "article_published:{$article->id}",
                'cta_kind' => 'open',
                'cta_payload' => ['href' => "/article/{$article->slug}", 'label' => 'Citeste articolul'],
            ]);
        }

        return redirect()
            ->route('article.show', ['slug' => $slug])
            ->with('status', 'Articolul a fost publicat.');
    }

    public function journal(Request $request): Response
    {
        $entries = [];
        $startDate = null;

        if ($request->user()) {
            $userId = $request->user()->id;
            $quickEntries = DB::table('journal_quick_entries as qe')
                ->join('mood_options as mo', 'mo.id', '=', 'qe.mood_id')
                ->where('qe.user_id', $userId)
                ->select('qe.id', 'qe.notes', 'qe.created_at', 'mo.label as mood_label', 'mo.emoji as mood_emoji')
                ->get()
                ->map(fn ($entry) => [
                    'id' => $entry->id,
                    'notes' => $entry->notes,
                    'created_at' => $entry->created_at,
                    'mood_label' => $entry->mood_label,
                    'mood_emoji' => $entry->mood_emoji,
                    'type' => 'quick',
                    'contexts' => [],
                    'symptoms' => [],
                ]);

            $fullEntries = DB::table('journal_entries as je')
                ->leftJoin('mood_options as mo', 'mo.id', '=', 'je.mood_id')
                ->where('je.user_id', $userId)
                ->select('je.id', 'je.notes', 'je.created_at', 'mo.label as mood_label', 'mo.emoji as mood_emoji')
                ->get()
                ->map(function ($entry) {
                    $contexts = DB::table('journal_entry_contexts as rec')
                        ->join('journal_context_tags as tag', 'tag.id', '=', 'rec.context_id')
                        ->where('rec.entry_id', $entry->id)
                        ->pluck('tag.label')
                        ->all();

                    $symptoms = DB::table('journal_entry_symptoms as res')
                        ->join('journal_symptom_tags as tag', 'tag.id', '=', 'res.symptom_id')
                        ->where('res.entry_id', $entry->id)
                        ->pluck('tag.label')
                        ->all();

                    return [
                        'id' => $entry->id,
                        'notes' => $entry->notes,
                        'created_at' => $entry->created_at,
                        'mood_label' => $entry->mood_label,
                        'mood_emoji' => $entry->mood_emoji,
                        'type' => 'full',
                        'contexts' => $contexts,
                        'symptoms' => $symptoms,
                    ];
                });

            $entries = $quickEntries
                ->concat($fullEntries)
                ->sortByDesc('created_at')
                ->values();

            $startDate = DB::table(DB::raw("(
                SELECT created_at FROM journal_entries WHERE user_id = {$userId}
                UNION ALL
                SELECT created_at FROM journal_quick_entries WHERE user_id = {$userId}
            ) as combined"))->min('created_at');
        }

        return Inertia::render('Journal', [
            'entries' => $entries,
            'startDate' => $startDate,
        ]);
    }

    public function psychologists(): Response
    {
        $activePsychologistId = Auth::guard('psychologist')->id();
        $activePsychologist = null;

        if ($activePsychologistId) {
            $activePsychologistRow = DB::table('psychologists')
                ->where('id', $activePsychologistId)
                ->first(['id', 'name', 'surname', 'email']);

            if ($activePsychologistRow) {
                $activePsychologist = [
                    'id' => $activePsychologistRow->id,
                    'firstName' => $activePsychologistRow->name,
                    'lastName' => $activePsychologistRow->surname,
                    'email' => $activePsychologistRow->email,
                ];
            }
        }

        return Inertia::render('Psychologists', [
            'psychologists' => DB::table('psychologists as p')
                ->leftJoin('psychologists_address as pa', 'pa.psychologist_id', '=', 'p.id')
                ->leftJoin('psychologist_validation_applications as pva', 'pva.psychologist_id', '=', 'p.id')
                ->select('p.id', 'p.slug', 'p.title', 'p.name', 'p.surname', 'p.supports_online', 'p.phone', 'p.email', 'pa.address', 'pa.city', 'pa.county', 'pva.status as validation_status')
                ->orderBy('p.surname')
                ->orderBy('p.name')
                ->get()
                ->map(function ($entry) {
                    $specialties = DB::table('psychologist_specialties')
                        ->where('psychologist_id', $entry->id)
                        ->orderBy('id')
                        ->pluck('label')
                        ->all();

                    return [
                        'id' => $entry->id,
                        'slug' => $entry->slug,
                        'title' => $entry->title,
                        'name' => $entry->name,
                        'surname' => $entry->surname,
                        'supports_online' => (bool) $entry->supports_online,
                        'phone' => $entry->phone,
                        'email' => $entry->email,
                        'address' => $entry->address,
                        'city' => $entry->city,
                        'county' => $entry->county,
                        'specialties' => $specialties,
                        'validationStatus' => $entry->validation_status === 'approved' ? 1 : 0,
                    ];
                }),
            'activePsychologist' => $activePsychologist,
        ]);
    }

    public function psychologistProfile(string $slug): Response|\Illuminate\Http\RedirectResponse
    {
        $psychologist = DB::table('psychologists as p')
            ->leftJoin('psychologists_address as pa', 'pa.psychologist_id', '=', 'p.id')
            ->leftJoin('psychologist_individual_profiles as pip', 'pip.psychologist_id', '=', 'p.id')
            ->leftJoin('psychologist_validation_applications as pva', 'pva.psychologist_id', '=', 'p.id')
            ->where('p.slug', $slug)
            ->where('pva.status', 'approved')
            ->select(
                'p.id',
                'p.slug',
                'p.title',
                'p.name',
                'p.surname',
                'p.supports_online',
                'p.phone',
                'p.email',
                'pa.address',
                'pa.city',
                'pa.county',
                'pip.public_bio',
                'pip.clinical_competencies'
            )
            ->first();

        if (! $psychologist) {
            return redirect()->route('psychologists')->with('status', 'Specialistul cautat nu este disponibil.');
        }

        $specialties = DB::table('psychologist_specialties')
            ->where('psychologist_id', $psychologist->id)
            ->orderBy('id')
            ->pluck('label')
            ->map(fn ($label) => $this->sanitizeProfessionalText($label))
            ->filter()
            ->values()
            ->all();

        $details = collect([
            [
                'label' => 'Specializari',
                'values' => $specialties,
            ],
            [
                'label' => 'Descriere profesionala',
                'value' => $this->sanitizeProfessionalText($psychologist->public_bio),
            ],
            [
                'label' => 'Competente clinice',
                'value' => $this->sanitizeProfessionalText($psychologist->clinical_competencies),
            ],
        ])->filter(fn ($item) => ! empty($item['value'] ?? null) || ! empty($item['values'] ?? []))
            ->values()
            ->all();

        return Inertia::render('PsychologistProfile', [
            'psychologist' => [
                'id' => $psychologist->id,
                'slug' => $psychologist->slug,
                'title' => $psychologist->title,
                'name' => $psychologist->name,
                'surname' => $psychologist->surname,
                'supports_online' => (bool) $psychologist->supports_online,
                'phone' => $psychologist->phone,
                'email' => $psychologist->email,
                'address' => $psychologist->address,
                'city' => $psychologist->city,
                'county' => $psychologist->county,
                'details' => $details,
            ],
        ]);
    }

    public function appointments(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $slug = (string) $request->query('psychologist', '');
        $requestedTypeId = max(0, (int) $request->query('type', 0));
        $requestedDate = (string) $request->query('date', '');
        $requestedTime = (string) $request->query('time', '');

        if ($slug === '') {
            return redirect()->route('psychologists')->with('status', 'Alege un specialist pentru a continua programarea.');
        }

        $specialist = $this->booking->approvedPsychologistBySlug($slug);
        if (! $specialist) {
            return redirect()->route('psychologists')->with('status', 'Specialistul selectat nu este disponibil pentru programari.');
        }

        $types = $this->booking->activeTypesForPsychologist((int) $specialist->id);
        $initialTypeId = $requestedTypeId > 0 && $types->contains(fn ($type) => (int) $type->id === $requestedTypeId)
            ? $requestedTypeId
            : (int) ($types->first()->id ?? 0);

        return Inertia::render('Appointments', [
            'specialist' => [
                'id' => $specialist->id,
                'slug' => $specialist->slug,
                'title' => $specialist->title,
                'name' => $specialist->name,
                'surname' => $specialist->surname,
                'supports_online' => (bool) $specialist->supports_online,
                'phone' => $specialist->phone,
                'email' => $specialist->email,
                'address' => $specialist->address,
                'city' => $specialist->city,
                'county' => $specialist->county,
            ],
            'types' => $types->values(),
            'initialTypeId' => $initialTypeId,
            'requestedBooking' => [
                'typeId' => $initialTypeId,
                'date' => preg_match('/^\d{4}-\d{2}-\d{2}$/', $requestedDate) ? $requestedDate : null,
                'time' => preg_match('/^\d{2}:\d{2}$/', $requestedTime) ? $requestedTime : null,
            ],
            'upcomingAppointments' => $request->user()
                ? $this->appointmentPresenter->forUser($request->user()->id)
                : [],
        ]);
    }

    public function article(Request $request, string $slug): Response
    {
        $article = DB::table('articles as a')
            ->leftJoin('psychologists as p', 'p.id', '=', 'a.author')
            ->leftJoin('article_topics as at', 'at.id', '=', 'a.topic_id')
            ->where('a.slug', $slug)
            ->select('a.id', 'a.slug', 'a.title', 'a.tag', 'a.minutes', 'a.hero_image', 'a.body', 'a.author as author_value', 'at.name as category', 'p.title as author_title', 'p.name as author_name', 'p.surname as author_surname')
            ->first();

        abort_unless($article, 404);

        $guestAuthor = $this->decodeGuestArticleAuthor($article->author_value);
        $author = $guestAuthor ?: trim(collect([$article->author_title, $article->author_name, $article->author_surname])->filter()->implode(' '));
        $articleId = $article->id;

        if ($request->user()) {
            $this->milestones->award($request->user()->id, 'first_article_read', 'article', (string) $articleId, [
                'slug' => $article->slug,
            ]);
        }

        return Inertia::render('Article', [
            'article' => [
                'id' => $article->id,
                'slug' => $article->slug,
                'title' => $article->title,
                'tag' => $article->tag,
                'category' => $article->category,
                'minutes' => $this->estimateArticleReadingMinutesFromBody($article->body, $article->minutes),
                'hero_image' => $article->hero_image,
                'body' => $this->normalizeArticleBody($article->body),
                'author' => $author ?: 'Specialist Calming',
                'author_role' => $guestAuthor ? 'Autor invitat' : 'Specialist Psihologie',
                'is_saved' => $request->user()
                    ? SavedArticle::query()->where('user_id', $request->user()->id)->where('article_id', $article->id)->where('status', 'active')->exists()
                    : false,
                'reminder_frequency' => $request->user()
                    ? SavedArticle::query()->where('user_id', $request->user()->id)->where('article_id', $article->id)->value('reminder_frequency')
                    : null,
            ],
            'related' => DB::table('related_articles as ra')
                ->join('articles as a', 'a.id', '=', 'ra.related_article_id')
                ->where('ra.article_id', $articleId)
                ->orderBy('ra.sort_order')
                ->select('a.slug', 'a.title', 'a.minutes', 'a.body')
                ->get()
                ->map(fn ($related) => [
                    'slug' => $related->slug,
                    'title' => $related->title,
                    'minutes' => $this->estimateArticleReadingMinutesFromBody($related->body, $related->minutes),
                ]),
        ]);
    }

    protected function profileRow(int $userId): ?array
    {
        $row = DB::table('user_profiles')->where('user_id', $userId)->first();

        if (! $row) {
            return null;
        }

        return [
            'display_name' => $row->display_name,
            'avatar_initials' => $row->avatar_initials,
            'member_since' => $row->member_since,
            'profile_completion' => $row->profile_completion,
            'community_alias' => $row->community_alias,
        ];
    }

    protected function profileDetailsRow(int $userId): ?array
    {
        $row = DB::table('user_profile_details')->where('user_id', $userId)->first();

        if (! $row) {
            return null;
        }

        return [
            'age_range' => $row->age_range,
            'focus_topics' => json_decode($row->focus_topics ?: '[]', true) ?: [],
            'primary_goal' => $row->primary_goal,
            'stress_triggers' => $row->stress_triggers,
            'coping_strategies' => $row->coping_strategies,
            'guidance_style' => $row->guidance_style,
            'check_in_preference' => $row->check_in_preference,
            'therapy_status' => $row->therapy_status,
            'notification_frequency' => $row->notification_frequency,
        ];
    }

    protected function serializeDateValue(mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(DATE_ATOM);
        }

        return $value;
    }

    protected function articleTopics()
    {
        return DB::table('article_topics')->orderBy('name')->get(['id', 'name']);
    }

    protected function uniqueArticleSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'articol';
        $slug = $base;
        $suffix = 2;

        while (
            DB::table('articles')
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    protected function estimateArticleReadingMinutes(string $body): int
    {
        $text = trim(strip_tags($body));
        $wordCount = str_word_count($text);

        return max(1, min(240, (int) ceil($wordCount / 200)));
    }

    protected function encodeGuestArticleAuthor(string $authorName): string
    {
        return 'guest:'.trim($authorName);
    }

    protected function decodeGuestArticleAuthor(?string $author): ?string
    {
        if (! is_string($author) || ! str_starts_with($author, 'guest:')) {
            return null;
        }

        $decoded = trim(Str::after($author, 'guest:'));

        return $decoded !== '' ? $decoded : null;
    }

    protected function normalizeArticleBody(?string $body): string
    {
        if (! $body) {
            return '';
        }

        $decoded = json_decode($body, true);

        if (is_array($decoded)) {
            return implode("\n\n", array_filter($decoded, fn ($item) => is_string($item) && $item !== ''));
        }

        if (is_string($decoded)) {
            return $this->stripEmptyArticleParagraphs($decoded);
        }

        return $this->stripEmptyArticleParagraphs($body);
    }

    protected function stripEmptyArticleParagraphs(string $html): string
    {
        $normalized = $html;
        $separatorPlaceholder = '__CALMING_ARTICLE_BREAK__';

        $emptyBlockPattern = '/<(p|div)>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>/i';
        $emptyBlockGroupPattern = '/(?:\s*<(?:p|div)>(?:\s|&nbsp;|<br\s*\/?>)*<\/(?:p|div)>\s*){2,}/i';

        $normalized = preg_replace($emptyBlockGroupPattern, $separatorPlaceholder, $normalized) ?? $normalized;
        $normalized = preg_replace($emptyBlockPattern, '', $normalized) ?? $normalized;
        $normalized = str_replace($separatorPlaceholder, '<div><br></div>', $normalized);
        $normalized = preg_replace('/^(?:\s*<div><br><\/div>\s*)+|(?:\s*<div><br><\/div>\s*)+$/i', '', $normalized) ?? $normalized;

        return trim($normalized);
    }

    protected function communityGroupPayload(string $slug, bool $includeDialogues = false): ?array
    {
        $group = DB::table('community_groups')
            ->leftJoin('community_groups_validation as cgv', 'cgv.group_id', '=', 'community_groups.id')
            ->where('slug', $slug)
            ->select('community_groups.*', 'cgv.is_valid as validation_is_valid')
            ->first();

        if (! $group) {
            return null;
        }

        $activePsychologistId = (int) (Auth::guard('psychologist')->id() ?? 0);
        if (! $this->communityVisibility->isVisibleToViewer($group, $activePsychologistId)) {
            return null;
        }

        $focusAreas = DB::table('community_group_focus_areas')
            ->where('group_id', $group->id)
            ->orderBy('sort_order')
            ->pluck('label')
            ->all();
        $messageRows = DB::table('community_dialogue_messages as messages')
            ->join('community_dialogues as dialogues', 'dialogues.id', '=', 'messages.dialogue_id')
            ->where('dialogues.group_id', $group->id)
            ->select('dialogues.stamp', 'messages.sender', 'messages.role', 'messages.time')
            ->orderBy('dialogues.sort_order')
            ->orderBy('messages.sort_order')
            ->get();
        $lastMessage = $messageRows->last();
        $memberCount = $this->communityMemberCount(
            (bool) $group->is_private,
            $group->id,
            $messageRows,
            DB::table('community_group_invitations')
                ->select('group_id', DB::raw('COUNT(*) as total'))
                ->where('group_id', $group->id)
                ->groupBy('group_id')
                ->pluck('total', 'group_id')
        );
        $lastMessageAt = $this->communityMessageDateTime($lastMessage?->stamp, $lastMessage?->time);
        $facilitatorName = $this->communityFacilitatorName((int) ($group->author ?? 0));

        $payload = [
            'id' => $group->id,
            'authorId' => $group->author,
            'slug' => $group->slug ?? str($group->name)->slug()->toString(),
            'name' => $group->name,
            'description' => $group->description,
            'schedule' => $group->schedule,
            'meetingLink' => $group->meeting_link,
            'facilitator' => $facilitatorName,
            'focusAreas' => $focusAreas,
            'safetyNote' => $group->safety_note,
            'isPrivate' => (bool) $group->is_private,
            'is_private' => (bool) $group->is_private,
            'members' => $memberCount,
            'memberLabel' => $this->communityMemberLabel($memberCount),
            'lastActive' => $this->communityExactElapsedLabel($lastMessageAt),
            'last_active' => $this->communityExactElapsedLabel($lastMessageAt),
        ];

        if (! $includeDialogues) {
            return $payload;
        }

        $dialogues = DB::table('community_dialogues')
            ->where('group_id', $group->id)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($dialogue) {
                $messages = DB::table('community_dialogue_messages')
                    ->where('dialogue_id', $dialogue->id)
                    ->orderBy('sort_order')
                    ->get()
                    ->map(fn ($message) => [
                        'sender' => $message->sender,
                        'role' => $message->role,
                        'roleLabel' => $this->communityRoleLabel($message->role),
                        'time' => $message->time,
                        'text' => $message->text,
                        'replyTo' => $message->reply_to,
                    ])
                    ->all();

                return [
                    'id' => $dialogue->id,
                    'stamp' => $dialogue->stamp,
                    'messages' => $messages,
                ];
            })
            ->all();

        return [
            ...$payload,
            'dialogues' => $dialogues,
        ];
    }

    protected function communityFacilitatorName(int $psychologistId): string
    {
        if ($psychologistId <= 0) {
            return 'Specialist Calming';
        }

        $psychologist = DB::table('psychologists')
            ->where('id', $psychologistId)
            ->first(['title', 'name', 'surname']);

        return trim(collect([$psychologist?->title, $psychologist?->name, $psychologist?->surname])->filter()->implode(' ')) ?: 'Specialist Calming';
    }

    protected function communityRoleLabel(?string $role): ?string
    {
        return match ($role) {
            'facilitator' => 'Moderator de grup',
            'coach' => 'Coach invitat',
            'specialist' => 'Specialist',
            'participant' => 'Participant',
            default => null,
        };
    }

    protected function canAccessCommunityGroupConversations(Request $request, int $groupId, bool $isPrivate, ?int $groupAuthorId = null): bool
    {
        $psychologistId = (int) (Auth::guard('psychologist')->id() ?? 0);
        if ($psychologistId > 0 && $groupAuthorId && $psychologistId === $groupAuthorId) {
            return true;
        }

        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (! $isPrivate) {
            return true;
        }

        return DB::table('community_group_invitations')
            ->where('group_id', $groupId)
            ->where('user_id', $user->id)
            ->exists();
    }

    protected function communityDialogueStamp(\DateTimeInterface $date): string
    {
        $weekdays = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata'];
        $months = [1 => 'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];

        return sprintf(
            '%s, %d %s %d',
            $weekdays[(int) $date->format('w')],
            (int) $date->format('j'),
            $months[(int) $date->format('n')],
            (int) $date->format('Y'),
        );
    }

    protected function communityMessageDateTime(?string $stamp, ?string $time): ?Carbon
    {
        if (! $stamp || ! preg_match('/^[^,]+,\s+(\d{1,2})\s+([[:alpha:]]+)\s+(\d{4})$/u', $stamp, $matches)) {
            return null;
        }

        $months = [
            'ianuarie' => 1,
            'februarie' => 2,
            'martie' => 3,
            'aprilie' => 4,
            'mai' => 5,
            'iunie' => 6,
            'iulie' => 7,
            'august' => 8,
            'septembrie' => 9,
            'octombrie' => 10,
            'noiembrie' => 11,
            'decembrie' => 12,
        ];
        $month = $months[mb_strtolower($matches[2])] ?? null;
        if (! $month) {
            return null;
        }

        [$hours, $minutes] = array_pad(explode(':', $time ?: '00:00', 2), 2, '00');

        return Carbon::create(
            (int) $matches[3],
            $month,
            (int) $matches[1],
            (int) $hours,
            (int) $minutes,
            0
        );
    }

    protected function communityExactElapsedLabel(?Carbon $lastMessageAt): string
    {
        if (! $lastMessageAt) {
            return 'fara mesaje';
        }

        $now = now();
        if ($lastMessageAt->greaterThan($now)) {
            return '0 minute';
        }

        $diff = $lastMessageAt->diff($now);
        $parts = [];

        if ($diff->days > 0) {
            $parts[] = $diff->days.' '.$this->communityPluralize($diff->days, 'zi', 'zile');
        }
        if ($diff->h > 0) {
            $parts[] = $diff->h.' '.$this->communityPluralize($diff->h, 'ora', 'ore');
        }
        if ($diff->i > 0) {
            $parts[] = $diff->i.' '.$this->communityPluralize($diff->i, 'minut', 'minute');
        }

        return $parts !== [] ? implode(' ', $parts) : '0 minute';
    }

    protected function communityMemberCount(bool $isPrivate, int $groupId, \Illuminate\Support\Collection $rows, \Illuminate\Support\Collection $invitationCounts): int
    {
        if ($isPrivate) {
            return (int) ($invitationCounts[$groupId] ?? 0);
        }

        return $rows
            ->reject(fn ($row) => $row->role === 'facilitator')
            ->pluck('sender')
            ->filter()
            ->unique()
            ->count();
    }

    protected function communityMemberLabel(int $count): string
    {
        return $count.' '.$this->communityPluralize($count, 'membru', 'membri');
    }

    protected function communityPluralize(int $count, string $singular, string $plural): string
    {
        return $count === 1 ? $singular : $plural;
    }

    protected function estimateArticleReadingMinutesFromBody(?string $body, mixed $fallbackMinutes = null): int
    {
        $normalizedBody = $this->normalizeArticleBody($body);
        $text = trim(strip_tags($normalizedBody));

        if ($text === '') {
            return max(1, (int) ($fallbackMinutes ?: 1));
        }

        $wordCount = str_word_count($text);

        return max(1, min(240, (int) ceil($wordCount / 200)));
    }

    protected function sanitizeProfessionalText(?string $value): ?string
    {
        $normalized = trim(preg_replace('/\s+/', ' ', (string) $value));

        if ($normalized === '') {
            return null;
        }

        return preg_match('/\d/', $normalized) ? null : $normalized;
    }

    protected function legalPages(): array
    {
        $company = [
            'name' => 'GREEN HORIZON CONCEPTS S.R.L.',
            'cui' => '51006687',
            'trade_register' => 'J2024047618008',
            'address' => 'Municipiul Bucuresti, Sector 3, Str. Idealului, nr. 40',
        ];

        return [
            'termeni-si-conditii' => [
                'eyebrow' => 'Legal',
                'title' => 'Termeni si Conditii',
                'description' => 'Termenii si conditiile de utilizare pentru platforma Calming.',
                'updatedAt' => '28 martie 2026',
                'company' => $company,
                'sections' => [
                    [
                        'heading' => '1. Despre platforma',
                        'paragraphs' => [
                            'Acest document reglementeaza accesul si utilizarea platformei Calming, operata de GREEN HORIZON CONCEPTS S.R.L. Platforma ofera continut informational, functii de suport digital, articole, comunitate si instrumente pentru organizarea interactiunii dintre utilizatori si specialisti.',
                            'Prin accesarea sau utilizarea platformei, confirmi ca ai citit si accepti acesti termeni si conditii. Daca nu esti de acord cu continutul lor, nu utiliza serviciile disponibile in platforma.',
                        ],
                    ],
                    [
                        'heading' => '2. Rolul platformei',
                        'paragraphs' => [
                            'Calming este o platforma digitala care faciliteaza accesul la resurse de informare si la servicii oferite de specialisti. Platforma nu inlocuieste serviciile medicale de urgenta, evaluarea clinica individuala sau relatia profesionala directa dintre utilizator si specialist.',
                            'Informatiile disponibile in aplicatie au scop orientativ si educational. Pentru situatii urgente sau riscuri imediate pentru sanatate ori siguranta, utilizatorul trebuie sa contacteze de urgenta serviciile competente.',
                        ],
                    ],
                    [
                        'heading' => '3. Contul utilizatorului',
                        'paragraphs' => [
                            'Pentru accesul la anumite functii poate fi necesara crearea unui cont. Utilizatorul este responsabil pentru corectitudinea datelor furnizate, securitatea credentialelor si utilizarea contului in conformitate cu legea si cu prezentii termeni.',
                            'Este interzisa folosirea identitatii altei persoane, distribuirea neautorizata a datelor de acces sau utilizarea platformei pentru activitati frauduloase, abuzive ori contrare scopului ei.',
                        ],
                    ],
                    [
                        'heading' => '4. Programari, continut si interactiuni',
                        'paragraphs' => [
                            'Programarile, mesajele, reminderele si alte functionalitati sunt oferite in masura disponibilitatii tehnice a platformei. Calming poate modifica, suspenda sau actualiza functii, formulare sau fluxuri de lucru pentru a mentine securitatea si functionarea serviciului.',
                            'Utilizatorii trebuie sa foloseasca limbaj adecvat si sa nu publice ori transmita continut ilegal, ofensator, defaimator, amenintator, discriminatoriu sau care incalca drepturile altor persoane.',
                        ],
                    ],
                    [
                        'heading' => '5. Drepturi de proprietate intelectuala',
                        'paragraphs' => [
                            'Designul platformei, textele, elementele grafice, structura, marcile, bazele de date si alte materiale disponibile in platforma sunt protejate de legislatia aplicabila privind drepturile de autor si proprietatea intelectuala.',
                            'Fara acordul scris al operatorului, este interzisa copierea, republicarea, distribuirea, comercializarea sau reutilizarea substantiala a continutului platformei in alte scopuri decat folosirea personala, legala si necomerciala.',
                        ],
                    ],
                    [
                        'heading' => '6. Limitarea raspunderii',
                        'paragraphs' => [
                            'Platforma este furnizata asa cum este si in limita disponibilitatii sale tehnice. Desi sunt depuse eforturi rezonabile pentru actualitate, securitate si functionare, operatorul nu garanteaza lipsa absoluta a erorilor, intreruperilor sau indisponibilitatii temporare.',
                            'Operatorul nu raspunde pentru prejudicii indirecte, pierderi de date, pierderi comerciale sau consecinte rezultate din utilizarea improprie a platformei ori din decizii luate exclusiv pe baza informatiilor publicate in aplicatie.',
                        ],
                    ],
                    [
                        'heading' => '7. Suspendare si incetare',
                        'paragraphs' => [
                            'Accesul la cont sau la anumite functii poate fi limitat, suspendat sau inchis daca exista suspiciuni rezonabile de utilizare abuziva, frauda, incalcare a legii, incalcare a prezentilor termeni ori afectare a securitatii platformei.',
                        ],
                    ],
                    [
                        'heading' => '8. Lege aplicabila si contact',
                        'paragraphs' => [
                            'Acesti termeni sunt guvernati de legislatia romana. Pentru intrebari legate de prezentul document sau de utilizarea platformei, ne poti contacta folosind datele societatii mentionate mai jos.',
                        ],
                    ],
                ],
            ],
            'confidentialitate' => [
                'eyebrow' => 'Legal',
                'title' => 'Confidentialitate',
                'description' => 'Informatii privind prelucrarea datelor cu caracter personal in platforma Calming.',
                'updatedAt' => '28 martie 2026',
                'company' => $company,
                'sections' => [
                    [
                        'heading' => '1. Operatorul datelor',
                        'paragraphs' => [
                            'GREEN HORIZON CONCEPTS S.R.L. actioneaza ca operator de date pentru prelucrarile efectuate prin platforma Calming, in masura in care stabileste scopurile si mijloacele prelucrarii datelor cu caracter personal ale utilizatorilor.',
                        ],
                    ],
                    [
                        'heading' => '2. Ce date putem prelucra',
                        'paragraphs' => [
                            'In functie de modul in care folosesti platforma, putem prelucra date de identificare si contact, date de cont, preferinte de utilizare, continut introdus de utilizator, date tehnice despre dispozitiv si interactiuni legate de notificari, articole, comunitate, programari si asistenta digitala.',
                            'Nu solicitam mai multe date decat sunt necesare pentru furnizarea functionalitatilor active in platforma si pentru respectarea obligatiilor legale aplicabile.',
                        ],
                    ],
                    [
                        'heading' => '3. Scopurile prelucrarii',
                        'paragraphs' => [
                            'Prelucram date pentru crearea si administrarea contului, oferirea functionalitatilor platformei, personalizarea experientei, gestionarea notificarilor, organizarea programarilor, securitate, suport tehnic, prevenirea abuzurilor si imbunatatirea serviciilor.',
                            'In anumite situatii, prelucrarea este necesara pentru executarea relatiei contractuale, pentru respectarea obligatiilor legale sau pentru interese legitime precum securitatea si functionarea platformei.',
                        ],
                    ],
                    [
                        'heading' => '4. Temeiurile legale',
                        'paragraphs' => [
                            'Prelucrarea se poate baza, dupa caz, pe executarea unui contract, consimtamant, obligatii legale sau interes legitim. Atunci cand un anumit flux necesita consimtamant, acesta poate fi retras pentru viitor in conditiile legii si in limitele tehnice ale serviciului.',
                        ],
                    ],
                    [
                        'heading' => '5. Cui putem divulga date',
                        'paragraphs' => [
                            'Datele pot fi accesate de personal autorizat, furnizori de servicii tehnice, parteneri implicati in functionarea platformei sau autoritati competente, numai in masura necesara si cu masuri adecvate de confidentialitate si securitate.',
                            'Nu vindem datele personale ale utilizatorilor si nu le folosim in afara scopurilor rezonabile asociate functionarii serviciului.',
                        ],
                    ],
                    [
                        'heading' => '6. Durata stocarii',
                        'paragraphs' => [
                            'Datele sunt pastrate pe durata necesara scopurilor pentru care au fost colectate, pe durata existentei contului sau pentru perioadele impuse de lege, dupa caz. La expirarea acestor perioade, datele sunt sterse, anonimizate sau arhivate conform cerintelor legale.',
                        ],
                    ],
                    [
                        'heading' => '7. Drepturile tale',
                        'paragraphs' => [
                            'Ai dreptul de acces, rectificare, stergere, restrictionare, opozitie, portabilitate, precum si dreptul de a depune plangere la autoritatea competenta, in conditiile legislatiei aplicabile privind protectia datelor.',
                            'Pentru exercitarea acestor drepturi, ne poti contacta folosind datele societatii mentionate pe aceasta pagina.',
                        ],
                    ],
                    [
                        'heading' => '8. Securitate',
                        'paragraphs' => [
                            'Aplicam masuri tehnice si organizatorice rezonabile pentru protejarea datelor, inclusiv controale de acces, segregarea rolurilor si monitorizarea functionarii sistemului. Nicio masura nu poate garanta securitate absoluta, insa urmarim reducerea riscurilor la un nivel adecvat.',
                        ],
                    ],
                ],
            ],
            'cookies' => [
                'eyebrow' => 'Legal',
                'title' => 'Cookies',
                'description' => 'Informatii despre modulele cookie si tehnologiile similare folosite de platforma Calming.',
                'updatedAt' => '28 martie 2026',
                'company' => $company,
                'sections' => [
                    [
                        'heading' => '1. Ce sunt cookie-urile',
                        'paragraphs' => [
                            'Cookie-urile sunt fisiere de mici dimensiuni sau tehnologii similare care pot fi stocate pe dispozitivul utilizatorului pentru a sustine functionarea platformei, memorarea preferintelor si analiza utilizarii serviciului.',
                        ],
                    ],
                    [
                        'heading' => '2. Ce tipuri de cookie-uri putem folosi',
                        'paragraphs' => [
                            'Putem utiliza cookie-uri strict necesare pentru autentificare, securitate, sesiune si functionarea esentiala a platformei.',
                            'Putem utiliza si cookie-uri functionale pentru memorarea preferintelor, precum tema vizuala sau anumite setari de utilizare. In masura in care sunt utilizate tehnologii de analiza sau masurare, acestea au rolul de a imbunatati performanta si experienta generala in aplicatie.',
                        ],
                    ],
                    [
                        'heading' => '3. Scopurile utilizarii',
                        'paragraphs' => [
                            'Cookie-urile si tehnologiile similare ne ajuta sa mentinem sesiunea activa, sa securizam conturile, sa retinem optiuni precum limba si preferintele de notificare si sa intelegem modul in care sunt utilizate diferitele sectiuni ale platformei.',
                        ],
                    ],
                    [
                        'heading' => '4. Controlul cookie-urilor',
                        'paragraphs' => [
                            'Poti controla sau sterge cookie-urile din setarile browserului tau. Dezactivarea anumitor cookie-uri poate afecta functionarea unor elemente ale platformei, inclusiv autentificarea, preferintele memorate sau alte functionalitati dependente de sesiune.',
                        ],
                    ],
                    [
                        'heading' => '5. Actualizari',
                        'paragraphs' => [
                            'Aceasta politica poate fi actualizata periodic pentru a reflecta schimbari tehnice, legislative sau operationale. Te incurajam sa revii periodic pentru a verifica versiunea curenta.',
                        ],
                    ],
                ],
            ],
            'tehnic' => [
                'eyebrow' => 'Tehnic',
                'title' => 'Date si stocare',
                'description' => 'Informatii despre gazduire, securitate, stocare si masurile tehnice folosite de platforma Calming.',
                'updatedAt' => '28 martie 2026',
                'company' => $company,
                'sections' => [
                    [
                        'heading' => '1. Gazduire si infrastructura',
                        'paragraphs' => [
                            'Platforma Calming este gazduita pe infrastructura VPS din Romania furnizata de ROMARG. Conform informatiilor publice publicate de furnizor pentru gama de servere VPS, infrastructura foloseste stocare NVMe si SSD, configuratii RAID 10, memorie DDR4, conectivitate uplink de 1000 Mbps si un centru de date Tier 3 cu uptime publicat de 99.982%.',
                            'Alegerea unei gazduiri VPS permite alocarea controlata a resurselor de procesare, memorie si stocare pentru aplicatie, cu separarea mediului de executie fata de alte proiecte gazduite pe platforme shared.',
                        ],
                    ],
                    [
                        'heading' => '2. Stocare si disponibilitate',
                        'paragraphs' => [
                            'Datele aplicatiei sunt operate intr-un mediu de server virtualizat, cu stocare rapida si redundanta la nivel de disc prin configuratii RAID, pentru a reduce riscurile asociate defectiunilor hardware punctuale.',
                            'Arhitectura tehnica este gandita pentru continuitate operationala, monitorizare si mentenanta periodica, in limita configuratiei si a serviciilor contractate de operator.',
                        ],
                    ],
                    [
                        'heading' => '3. Criptare si transmiterea datelor',
                        'paragraphs' => [
                            'Accesul la platforma trebuie realizat exclusiv prin conexiuni securizate HTTPS/TLS, pentru a proteja datele aflate in tranzit intre browserul utilizatorului si server.',
                            'Credentialele conturilor sunt pastrate folosind mecanisme de hash dedicate parolelor, iar datele sensibile sunt accesibile numai in masura necesara functionarii aplicatiei si exclusiv de catre rolurile autorizate.',
                        ],
                    ],
                    [
                        'heading' => '4. Control de acces si securitate aplicativa',
                        'paragraphs' => [
                            'Platforma foloseste controale de autentificare, separarea rolurilor, verificari de sesiune, protectii impotriva accesului neautorizat si masuri pentru limitarea utilizarii abuzive a functionalitatilor.',
                            'Accesul la datele utilizatorilor este restrictionat pe baza de rol si nevoie operationala, iar fluxurile critice sunt protejate prin validare de input, sesiuni controlate si mecanisme anti-CSRF la nivelul aplicatiei web.',
                        ],
                    ],
                    [
                        'heading' => '5. Jurnale, monitorizare si recuperare',
                        'paragraphs' => [
                            'Pentru operare si securitate pot fi generate jurnale tehnice privind erori, autentificare, executie si evenimente relevante pentru functionarea serviciului. Acestea sunt utilizate pentru diagnostic, audit operational si raspuns la incidente.',
                            'Operatorul urmareste mentinerea unui nivel adecvat de backup, recuperare si continuitate, proportional cu natura serviciului si cu configuratia tehnica folosita la momentul respectiv.',
                        ],
                    ],
                    [
                        'heading' => '6. Limite si actualizari',
                        'paragraphs' => [
                            'Nicio infrastructura online nu poate garanta securitate absoluta sau disponibilitate permanenta. Configuratiile tehnice, furnizorii, politicile de backup si masurile operationale pot fi actualizate periodic pentru a raspunde nevoilor platformei si riscurilor identificate.',
                            'Pentru detalii comerciale despre infrastructura VPS folosita ca referinta de gazduire, operatorul poate consulta in mod public pagina ROMARG dedicata serverelor VPS.',
                        ],
                    ],
                ],
            ],
        ];
    }

    protected function documentNavItems(bool $includeHelp = false): array
    {
        $items = [
            ['label' => 'Termeni si Conditii', 'href' => route('legal.show', 'termeni-si-conditii')],
            ['label' => 'Confidentialitate', 'href' => route('legal.show', 'confidentialitate')],
            ['label' => 'Cookies', 'href' => route('legal.show', 'cookies')],
            ['label' => 'Date si stocare', 'href' => route('technical')],
        ];

        if ($includeHelp) {
            $items[] = ['label' => 'Ajutor', 'href' => route('help')];
        }

        return $items;
    }

    protected function helpSections(): array
    {
        return [
            [
                'heading' => 'Acasa: la ce foloseste aceasta pagina?',
                'paragraphs' => [
                    'Pagina Acasa este punctul de pornire in aplicatie. Aici vezi rapid acces catre articole, comunitate, asistent, psihologi si cele mai utile zone ale platformei.',
                    'Avantajul principal este orientarea rapida: utilizatorul poate intra in cateva secunde in zona de continut, suport sau programare care il intereseaza.',
                ],
            ],
            [
                'heading' => 'Assistant: ce face si la ce ma ajuta?',
                'paragraphs' => [
                    'Assistantul este zona de conversatie ghidata a aplicatiei. Poate sustine check-in-uri emotionale, clarificarea unei stari, organizarea gandurilor si identificarea unui urmator pas util.',
                    'Assistantul nu inlocuieste interventia profesionala sau serviciile de urgenta, dar ofera suport rapid, contextual si usor accesibil direct din platforma.',
                ],
            ],
            [
                'heading' => 'Articole: de ce exista biblioteca de continut?',
                'paragraphs' => [
                    'Biblioteca de articole este construita pentru informare si educatie. Utilizatorul poate explora teme de sanatate emotionala, autoreglare, relatii, stres si alte subiecte relevante.',
                    'Avantajul este accesul la continut usor de parcurs si la recomandari suplimentare, astfel incat fiecare tema sa poata fi aprofundata in ritmul propriu.',
                ],
            ],
            [
                'heading' => 'Favorite Articles: la ce foloseste salvarea articolelor?',
                'paragraphs' => [
                    'Articolele favorite permit construirea unei biblioteci personale. Utilizatorul poate reveni rapid la materialele pe care le considera importante sau utile pentru momentul sau.',
                    'Aceasta functie este utila mai ales pentru continutul la care utilizatorul vrea sa revina ulterior, fara sa il caute din nou in toata platforma.',
                ],
            ],
            [
                'heading' => 'Comunitate: ce se intampla in aceasta zona?',
                'paragraphs' => [
                    'Zona Comunitate reuneste conversatii si grupuri in jurul unor interese sau nevoi comune. Aici utilizatorii pot urmari schimburi de experienta si interactiuni moderate la nivel de grup.',
                    'Avantajul major este sentimentul de apartenenta si accesul la dialog, fara a depinde exclusiv de interactiuni unu la unu.',
                ],
            ],
            [
                'heading' => 'Comunitate / Conversatii: cum functioneaza dialogurile?',
                'paragraphs' => [
                    'Pagina de conversatii afiseaza mesajele dintr-un grup si permite trimiterea de raspunsuri intr-un flux ordonat. Exista facilitati pentru reply, filtrare vizuala si citire usoara a dialogului.',
                    'Scopul este mentinerea unei comunicari clare si usor de urmarit, inclusiv pe mobil.',
                ],
            ],
            [
                'heading' => 'Psihologi: cum ma ajuta aceasta pagina?',
                'paragraphs' => [
                    'Pagina Psihologi este locul in care utilizatorul descopera specialistii disponibili si poate evalua optiunile relevante pentru nevoile sale.',
                    'Avantajul este ca platforma centralizeaza intr-un singur loc specialisti, profiluri si traseul catre programare.',
                ],
            ],
            [
                'heading' => 'Programari: ce pot face aici?',
                'paragraphs' => [
                    'Pagina Programari este destinata administrarii interactiunilor cu specialistii. Aici pot aparea disponibilitati, solicitari, statusuri si remindere legate de intalniri.',
                    'Beneficiul este organizarea intr-un singur loc a etapelor legate de programari, fara fragmentarea informatiei.',
                ],
            ],
            [
                'heading' => 'Jurnal: de ce este util?',
                'paragraphs' => [
                    'Jurnalul permite notarea starilor, contextelor si observatiilor personale. Este util pentru urmarirea evolutiei in timp si pentru clarificarea tiparelor emotionale sau de comportament.',
                    'Avantajul major este continuitatea: utilizatorul poate observa schimbari, poate reveni la intrari mai vechi si isi poate construi o imagine mai clara despre propriul parcurs.',
                ],
            ],
            [
                'heading' => 'Notificari: ce rol au in aplicatie?',
                'paragraphs' => [
                    'Pagina Notificari centralizeaza remindere, evenimente relevante si alte informari generate de sistem. Ea ajuta utilizatorul sa nu piarda repere importante legate de activitatea sa in platforma.',
                    'Daca notificările sunt dezactivate din Settings, aceasta zona nu mai afiseaza feed-ul activ.',
                ],
            ],
            [
                'heading' => 'Profil: ce gasesc in aceasta pagina?',
                'paragraphs' => [
                    'Pagina Profil concentreaza informatii despre utilizator, activitatea sa in aplicatie si legaturi utile catre zone precum articole favorite, remindere sau alte repere personale.',
                    'Scopul ei este sa ofere un punct central pentru identitate, progres si acces rapid la functionalitatile cele mai personale.',
                ],
            ],
            [
                'heading' => 'Settings: ce pot controla din Setari?',
                'paragraphs' => [
                    'Din Settings utilizatorul poate controla preferinte precum tema, notificarile si accesul la documentele despre confidentialitate, tehnic, termeni sau suport.',
                    'Avantajul este controlul clar asupra experientei in aplicatie si accesul rapid la documentatia explicativa.',
                ],
            ],
            [
                'heading' => 'Autentificare si recuperare parola: de ce exista aceste fluxuri?',
                'paragraphs' => [
                    'Fluxurile de autentificare, inregistrare, recuperare parola si verificare a accesului au rolul de a proteja contul si de a pastra continuitatea datelor utilizatorului.',
                    'Ele sunt esentiale pentru sincronizare intre dispozitive, siguranta accesului si pastrarea istoricului personal in platforma.',
                ],
            ],
        ];
    }
}
