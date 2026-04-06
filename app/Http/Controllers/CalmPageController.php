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
use Illuminate\Support\Facades\Schema;
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

        $recommendedArticles = DB::table('articles as a')
            ->leftJoin('articles_validation as av', 'av.article_id', '=', 'a.id')
            ->where(function ($query) {
                $query->whereNull('av.article_id')->orWhere('av.is_valid', 1);
            })
            ->orderByDesc('a.created_at')
            ->orderByDesc('a.id')
            ->limit(3)
            ->select('a.slug', 'a.title', 'a.minutes', 'a.body')
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
                'messages.text',
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
                    'lastCommentPreview' => $this->communityMessagePreview($lastMessage?->text),
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
                    'lastActiveExact' => $groupStats[$group->id]['lastActiveExact'] ?? 'fără mesaje',
                    'lastCommentPreview' => $groupStats[$group->id]['lastCommentPreview'] ?? null,
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
                'body' => "Ai scris în {$group['name']}. Revino oricând pentru răspunsuri noi.",
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
            'description' => 'Întrebări și răspunsuri despre paginile, funcționalitățile și avantajele principale ale aplicației Calming.',
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
            'hero_image' => $this->articleImagePath($imagePath),
            'author' => null,
            'guest_author_name' => trim($validated['author_name']),
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
                    'message' => 'A apărut un articol nou în secțiunea de articole.',
                    'default_title' => 'Articol nou',
                    'default_body' => 'A apărut un articol nou în secțiunea de articole.',
                    'icon' => 'FiBookOpen',
                    'icon_color' => 'lilac',
                    'accent' => 'lilac',
                    'priority' => 3,
                    'cta_kind' => 'open',
                    'cta_label' => 'Citește acum',
                    'deep_link' => '/learn',
                    'is_repeatable' => true,
                    'published_at' => now(),
                ]
            );

            $this->notifications->publishBroadcast('article_published', [
                'title' => 'Articol nou în secțiunea de articole',
                'body' => $article->title,
                'trigger_type' => 'article',
                'trigger_id' => (string) $article->id,
                'dedupe_key' => "article_published:{$article->id}",
                'cta_kind' => 'open',
                'cta_payload' => ['href' => "/article/{$article->slug}", 'label' => 'Citește articolul'],
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

        $approvedPsychologists = DB::table('psychologists as p')
            ->leftJoin('psychologists_address as pa', 'pa.psychologist_id', '=', 'p.id')
            ->leftJoin('psychologist_validation_applications as pva', 'pva.psychologist_id', '=', 'p.id')
            ->select('p.id', 'p.slug', 'p.title', 'p.name', 'p.surname', 'p.supports_online', 'p.phone', 'p.email', 'pa.address', 'pa.city', 'pa.county')
            ->where('pva.status', 'approved')
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
                    'id' => "psychologist-{$entry->id}",
                    'recordType' => 'psychologist',
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
                    'validationStatus' => 1,
                ];
            });

        $importedPsychologists = Schema::hasTable('psychologist_imports')
            ? DB::table('psychologist_imports')
                ->where('is_registered', false)
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
                ->map(fn ($entry) => [
                    'id' => "import-{$entry->id}",
                    'recordType' => 'import',
                    'slug' => null,
                    'title' => null,
                    'name' => $entry->first_name,
                    'surname' => $entry->last_name,
                    'supports_online' => false,
                    'phone' => $entry->phone,
                    'email' => $entry->professional_email,
                    'address' => null,
                    'city' => null,
                    'county' => null,
                    'specialties' => array_values(array_filter([
                        $entry->specialization,
                        $entry->specialty_commission,
                        $entry->professional_grade,
                    ])),
                    'validationStatus' => 0,
                ])
            : collect();

        return Inertia::render('Psychologists', [
            'psychologists' => $approvedPsychologists
                ->concat($importedPsychologists)
                ->sortBy([
                    ['validationStatus', 'desc'],
                    ['surname', 'asc'],
                    ['name', 'asc'],
                ])
                ->values(),
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
                'label' => 'Specializări',
                'values' => $specialties,
            ],
            [
                'label' => 'Descriere profesională',
                'value' => $this->sanitizeProfessionalText($psychologist->public_bio),
            ],
            [
                'label' => 'Competențe clinice',
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
            return redirect()->route('psychologists')->with('status', 'Specialistul selectat nu este disponibil pentru programări.');
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
            ->select('a.id', 'a.slug', 'a.title', 'a.tag', 'a.minutes', 'a.hero_image', 'a.body', 'a.guest_author_name', 'at.name as category', 'p.title as author_title', 'p.name as author_name', 'p.surname as author_surname')
            ->first();

        abort_unless($article, 404);

        $guestAuthor = trim((string) ($article->guest_author_name ?? '')) ?: null;
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
            'meta' => [
                'title' => "{$article->title} - Calming",
                'description' => $this->articleMetaDescription($article->body),
                'type' => 'article',
                'url' => $request->fullUrl(),
                'image' => $this->absoluteMediaUrl($article->hero_image, $request),
                'image_alt' => $article->title,
                'site_name' => 'Calming',
                'locale' => 'ro_RO',
                'canonical' => $request->fullUrl(),
                'twitter_card' => 'summary_large_image',
            ],
            'related' => $this->relatedArticlesFor($article),
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

    protected function articleImagePath(string $path): string
    {
        return '/storage/'.ltrim($path, '/');
    }

    protected function articleMetaDescription(?string $body): string
    {
        $text = trim(preg_replace('/\s+/', ' ', strip_tags($this->normalizeArticleBody($body))));

        return $text !== ''
            ? str($text)->limit(170, '...')->toString()
            : 'Îndrumare confidențială pentru echilibrul tău. Explorează articole și resurse Calming.';
    }

    protected function absoluteMediaUrl(?string $value, Request $request): ?string
    {
        if (! $value) {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return rtrim($request->getSchemeAndHttpHost(), '/').'/'.ltrim($value, '/');
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

    protected function relatedArticlesFor(object $article)
    {
        return DB::table('articles as a')
            ->leftJoin('articles_validation as av', 'av.article_id', '=', 'a.id')
            ->where('a.id', '!=', $article->id)
            ->where(function ($query) {
                $query->whereNull('av.article_id')->orWhere('av.is_valid', 1);
            })
            ->orderByDesc('a.id')
            ->limit(3)
            ->select('a.slug', 'a.title', 'a.minutes', 'a.body')
            ->get()
            ->map(fn ($related) => [
                'slug' => $related->slug,
                'title' => $related->title,
                'minutes' => $this->estimateArticleReadingMinutesFromBody($related->body, $related->minutes),
            ])
            ->values();
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
            return 'fără mesaje';
        }

        $now = now();
        if ($lastMessageAt->greaterThan($now)) {
            return '0 minute';
        }

        $diff = $lastMessageAt->diff($now);
        $parts = [];

        if ($diff->days > 0) {
            $parts[] = $diff->days.' '.$this->communityPluralize($diff->days, 'zi', 'zile');

            if ($diff->h > 0) {
                $parts[] = $diff->h.' '.$this->communityPluralize($diff->h, 'ora', 'ore');
            }

            return implode(' ', $parts);
        }

        if ($diff->h > 0) {
            $parts[] = $diff->h.' '.$this->communityPluralize($diff->h, 'ora', 'ore');
        }

        $parts[] = $diff->i.' '.$this->communityPluralize($diff->i, 'minut', 'minute');

        return implode(' ', $parts);
    }

    protected function communityMessagePreview(?string $text): ?string
    {
        $normalized = trim((string) preg_replace('/\s+/u', ' ', (string) $text));

        if ($normalized === '') {
            return null;
        }

        return Str::limit($normalized, 90, '...');
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
                'title' => 'Termeni și Condiții',
                'description' => 'Termenii și condițiile de utilizare pentru platforma Calming.',
                'updatedAt' => '28 martie 2026',
                'company' => $company,
                'sections' => [
                    [
                        'heading' => '1. Despre platforma',
                        'paragraphs' => [
                            'Acest document reglementează accesul și utilizarea platformei Calming, operată de GREEN HORIZON CONCEPTS S.R.L. Platforma oferă conținut informațional, funcții de suport digital, articole, comunitate și instrumente pentru organizarea interacțiunii dintre utilizatori și specialiști.',
                            'Prin accesarea sau utilizarea platformei, confirmi că ai citit și accepți acești termeni și condiții. Dacă nu ești de acord cu conținutul lor, nu utiliza serviciile disponibile în platformă.',
                        ],
                    ],
                    [
                        'heading' => '2. Rolul platformei',
                        'paragraphs' => [
                            'Calming este o platformă digitală care facilitează accesul la resurse de informare și la servicii oferite de specialiști. Platforma nu înlocuiește serviciile medicale de urgență, evaluarea clinică individuală sau relația profesională directă dintre utilizator și specialist.',
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
                        'heading' => '4. Programări, conținut și interacțiuni',
                        'paragraphs' => [
                            'Programările, mesajele, reminderele și alte funcționalități sunt oferite în măsura disponibilității tehnice a platformei. Calming poate modifica, suspenda sau actualiza funcții, formulare sau fluxuri de lucru pentru a menține securitatea și funcționarea serviciului.',
                            'Utilizatorii trebuie să folosească limbaj adecvat și să nu publice ori transmită conținut ilegal, ofensator, defăimător, amenințător, discriminatoriu sau care încalcă drepturile altor persoane.',
                        ],
                    ],
                    [
                        'heading' => '5. Drepturi de proprietate intelectuala',
                        'paragraphs' => [
                            'Designul platformei, textele, elementele grafice, structura, marcile, bazele de date si alte materiale disponibile in platforma sunt protejate de legislatia aplicabila privind drepturile de autor si proprietatea intelectuala.',
                            'Fără acordul scris al operatorului, este interzisă copierea, republicarea, distribuirea, comercializarea sau reutilizarea substanțială a conținutului platformei în alte scopuri decât folosirea personală, legală și necomercială.',
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
                            'Acești termeni sunt guvernați de legislația română. Pentru întrebări legate de prezentul document sau de utilizarea platformei, ne poți contacta folosind datele societății menționate mai jos.',
                        ],
                    ],
                ],
            ],
            'confidentialitate' => [
                'eyebrow' => 'Legal',
                'title' => 'Confidențialitate',
                'description' => 'Informații privind prelucrarea datelor cu caracter personal în platforma Calming.',
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
                            'În funcție de modul în care folosești platforma, putem prelucra date de identificare și contact, date de cont, preferințe de utilizare, conținut introdus de utilizator, date tehnice despre dispozitiv și interacțiuni legate de notificări, articole, comunitate, programări și asistență digitală.',
                            'Nu solicităm mai multe date decât sunt necesare pentru furnizarea funcționalităților active în platformă și pentru respectarea obligațiilor legale aplicabile.',
                        ],
                    ],
                    [
                        'heading' => '3. Scopurile prelucrarii',
                        'paragraphs' => [
                            'Prelucrăm date pentru crearea și administrarea contului, oferirea funcționalităților platformei, personalizarea experienței, gestionarea notificărilor, organizarea programărilor, securitate, suport tehnic, prevenirea abuzurilor și îmbunătățirea serviciilor.',
                            'În anumite situații, prelucrarea este necesară pentru executarea relației contractuale, pentru respectarea obligațiilor legale sau pentru interese legitime precum securitatea și funcționarea platformei.',
                        ],
                    ],
                    [
                        'heading' => '4. Temeiurile legale',
                        'paragraphs' => [
                            'Prelucrarea se poate baza, după caz, pe executarea unui contract, consimțământ, obligații legale sau interes legitim. Atunci când un anumit flux necesită consimțământ, acesta poate fi retras pentru viitor în condițiile legii și în limitele tehnice ale serviciului.',
                        ],
                    ],
                    [
                        'heading' => '5. Cui putem divulga date',
                        'paragraphs' => [
                            'Datele pot fi accesate de personal autorizat, furnizori de servicii tehnice, parteneri implicați în funcționarea platformei sau autorități competente, numai în măsura necesară și cu măsuri adecvate de confidențialitate și securitate.',
                            'Nu vindem datele personale ale utilizatorilor și nu le folosim în afara scopurilor rezonabile asociate funcționării serviciului.',
                        ],
                    ],
                    [
                        'heading' => '6. Durata stocarii',
                        'paragraphs' => [
                            'Datele sunt păstrate pe durata necesară scopurilor pentru care au fost colectate, pe durata existenței contului sau pentru perioadele impuse de lege, după caz. La expirarea acestor perioade, datele sunt șterse, anonimizate sau arhivate conform cerințelor legale.',
                        ],
                    ],
                    [
                        'heading' => '7. Drepturile tale',
                        'paragraphs' => [
                            'Ai dreptul de acces, rectificare, ștergere, restricționare, opoziție, portabilitate, precum și dreptul de a depune plângere la autoritatea competentă, în condițiile legislației aplicabile privind protecția datelor.',
                            'Pentru exercitarea acestor drepturi, ne poți contacta folosind datele societății menționate pe această pagină.',
                        ],
                    ],
                    [
                        'heading' => '8. Securitate',
                        'paragraphs' => [
                            'Aplicăm măsuri tehnice și organizatorice rezonabile pentru protejarea datelor, inclusiv controale de acces, segregarea rolurilor și monitorizarea funcționării sistemului. Nicio măsură nu poate garanta securitate absolută, însă urmărim reducerea riscurilor la un nivel adecvat.',
                        ],
                    ],
                ],
            ],
            'cookies' => [
                'eyebrow' => 'Legal',
                'title' => 'Cookies',
                'description' => 'Informații despre modulele cookie și tehnologiile similare folosite de platforma Calming.',
                'updatedAt' => '28 martie 2026',
                'company' => $company,
                'sections' => [
                    [
                        'heading' => '1. Ce sunt cookie-urile',
                        'paragraphs' => [
                            'Cookie-urile sunt fișiere de mici dimensiuni sau tehnologii similare care pot fi stocate pe dispozitivul utilizatorului pentru a susține funcționarea platformei, memorarea preferințelor și analiza utilizării serviciului.',
                        ],
                    ],
                    [
                        'heading' => '2. Ce tipuri de cookie-uri putem folosi',
                        'paragraphs' => [
                            'Putem utiliza cookie-uri strict necesare pentru autentificare, securitate, sesiune si functionarea esentiala a platformei.',
                            'Putem utiliza și cookie-uri funcționale pentru memorarea preferințelor, precum tema vizuală sau anumite setări de utilizare. În măsura în care sunt utilizate tehnologii de analiză sau măsurare, acestea au rolul de a îmbunătăți performanța și experiența generală în aplicație.',
                        ],
                    ],
                    [
                        'heading' => '3. Scopurile utilizarii',
                        'paragraphs' => [
                            'Cookie-urile și tehnologiile similare ne ajută să menținem sesiunea activă, să securizăm conturile, să reținem opțiuni precum limba și preferințele de notificare și să înțelegem modul în care sunt utilizate diferitele secțiuni ale platformei.',
                        ],
                    ],
                    [
                        'heading' => '4. Controlul cookie-urilor',
                        'paragraphs' => [
                            'Poți controla sau șterge cookie-urile din setările browserului tău. Dezactivarea anumitor cookie-uri poate afecta funcționarea unor elemente ale platformei, inclusiv autentificarea, preferințele memorate sau alte funcționalități dependente de sesiune.',
                        ],
                    ],
                    [
                        'heading' => '5. Actualizari',
                        'paragraphs' => [
                            'Această politică poate fi actualizată periodic pentru a reflecta schimbări tehnice, legislative sau operaționale. Te încurajăm să revii periodic pentru a verifica versiunea curentă.',
                        ],
                    ],
                ],
            ],
            'tehnic' => [
                'eyebrow' => 'Tehnic',
                'title' => 'Date și stocare',
                'description' => 'Informații despre găzduire, securitate, stocare și măsurile tehnice folosite de platforma Calming.',
                'updatedAt' => '28 martie 2026',
                'company' => $company,
                'sections' => [
                    [
                        'heading' => '1. Găzduire și infrastructură',
                        'paragraphs' => [
                            'Platforma Calming este găzduită pe infrastructura VPS din România furnizată de ROMARG. Conform informațiilor publice publicate de furnizor pentru gama de servere VPS, infrastructura folosește stocare NVMe și SSD, configurații RAID 10, memorie DDR4, conectivitate uplink de 1000 Mbps și un centru de date Tier 3 cu uptime publicat de 99.982%.',
                            'Alegerea unei găzduiri VPS permite alocarea controlată a resurselor de procesare, memorie și stocare pentru aplicație, cu separarea mediului de execuție față de alte proiecte găzduite pe platforme shared.',
                        ],
                    ],
                    [
                        'heading' => '2. Stocare și disponibilitate',
                        'paragraphs' => [
                            'Datele aplicației sunt operate într-un mediu de server virtualizat, cu stocare rapidă și redundanță la nivel de disc prin configurații RAID, pentru a reduce riscurile asociate defecțiunilor hardware punctuale.',
                            'Arhitectura tehnică este gândită pentru continuitate operațională, monitorizare și mentenanță periodică, în limita configurației și a serviciilor contractate de operator.',
                        ],
                    ],
                    [
                        'heading' => '3. Criptare și transmiterea datelor',
                        'paragraphs' => [
                            'Accesul la platformă trebuie realizat exclusiv prin conexiuni securizate HTTPS/TLS, pentru a proteja datele aflate în tranzit între browserul utilizatorului și server.',
                            'Credentialele conturilor sunt păstrate folosind mecanisme de hash dedicate parolelor, iar datele sensibile sunt accesibile numai în măsura necesară funcționării aplicației și exclusiv de către rolurile autorizate.',
                        ],
                    ],
                    [
                        'heading' => '4. Control de acces și securitate aplicativă',
                        'paragraphs' => [
                            'Platforma folosește controale de autentificare, separarea rolurilor, verificări de sesiune, protecții împotriva accesului neautorizat și măsuri pentru limitarea utilizării abuzive a funcționalităților.',
                            'Accesul la datele utilizatorilor este restricționat pe bază de rol și nevoie operațională, iar fluxurile critice sunt protejate prin validare de input, sesiuni controlate și mecanisme anti-CSRF la nivelul aplicației web.',
                        ],
                    ],
                    [
                        'heading' => '5. Jurnale, monitorizare și recuperare',
                        'paragraphs' => [
                            'Pentru operare și securitate pot fi generate jurnale tehnice privind erori, autentificare, execuție și evenimente relevante pentru funcționarea serviciului. Acestea sunt utilizate pentru diagnostic, audit operațional și răspuns la incidente.',
                            'Operatorul urmărește menținerea unui nivel adecvat de backup, recuperare și continuitate, proporțional cu natura serviciului și cu configurația tehnică folosită la momentul respectiv.',
                        ],
                    ],
                    [
                        'heading' => '6. Limite și actualizări',
                        'paragraphs' => [
                            'Nicio infrastructură online nu poate garanta securitate absolută sau disponibilitate permanentă. Configurațiile tehnice, furnizorii, politicile de backup și măsurile operaționale pot fi actualizate periodic pentru a răspunde nevoilor platformei și riscurilor identificate.',
                            'Pentru detalii comerciale despre infrastructura VPS folosită ca referință de găzduire, operatorul poate consulta în mod public pagina ROMARG dedicată serverelor VPS.',
                        ],
                    ],
                ],
            ],
        ];
    }

    protected function documentNavItems(bool $includeHelp = false): array
    {
        $items = [
            ['label' => 'Termeni și Condiții', 'href' => route('legal.show', 'termeni-si-conditii')],
            ['label' => 'Confidențialitate', 'href' => route('legal.show', 'confidentialitate')],
            ['label' => 'Cookies', 'href' => route('legal.show', 'cookies')],
            ['label' => 'Date și stocare', 'href' => route('technical')],
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
                'heading' => 'Acasă: la ce folosește această pagină?',
                'paragraphs' => [
                    'Pagina Acasă este punctul de pornire în aplicație. Aici vezi rapid acces către articole, comunitate, asistent, psihologi și cele mai utile zone ale platformei.',
                    'Avantajul principal este orientarea rapidă: utilizatorul poate intra în câteva secunde în zona de conținut, suport sau programare care îl interesează.',
                ],
            ],
            [
                'heading' => 'Assistant: ce face și la ce mă ajută?',
                'paragraphs' => [
                    'Assistantul este zona de conversație ghidată a aplicației. Poate susține check-in-uri emoționale, clarificarea unei stări, organizarea gândurilor și identificarea unui următor pas util.',
                    'Assistantul nu înlocuiește intervenția profesională sau serviciile de urgență, dar oferă suport rapid, contextual și ușor accesibil direct din platformă.',
                ],
            ],
            [
                'heading' => 'Articole: de ce există biblioteca de conținut?',
                'paragraphs' => [
                    'Biblioteca de articole este construită pentru informare și educație. Utilizatorul poate explora teme de sănătate emoțională, autoreglare, relații, stres și alte subiecte relevante.',
                    'Avantajul este accesul la conținut ușor de parcurs și la recomandări suplimentare, astfel încât fiecare temă să poată fi aprofundată în ritmul propriu.',
                ],
            ],
            [
                'heading' => 'Favorite Articles: la ce folosește salvarea articolelor?',
                'paragraphs' => [
                    'Articolele favorite permit construirea unei biblioteci personale. Utilizatorul poate reveni rapid la materialele pe care le considera importante sau utile pentru momentul sau.',
                    'Această funcție este utilă mai ales pentru conținutul la care utilizatorul vrea să revină ulterior, fără să îl caute din nou în toată platforma.',
                ],
            ],
            [
                'heading' => 'Comunitate: ce se întâmplă în această zonă?',
                'paragraphs' => [
                    'Zona Comunitate reunește conversații și grupuri în jurul unor interese sau nevoi comune. Aici utilizatorii pot urmări schimburi de experiență și interacțiuni moderate la nivel de grup.',
                    'Avantajul major este sentimentul de apartenență și accesul la dialog, fără a depinde exclusiv de interacțiuni unu la unu.',
                ],
            ],
            [
                'heading' => 'Comunitate / Conversații: cum funcționează dialogurile?',
                'paragraphs' => [
                    'Pagina de conversații afișează mesajele dintr-un grup și permite trimiterea de răspunsuri într-un flux ordonat. Există facilități pentru reply, filtrare vizuală și citire ușoară a dialogului.',
                    'Scopul este menținerea unei comunicări clare și ușor de urmărit, inclusiv pe mobil.',
                ],
            ],
            [
                'heading' => 'Psihologi: cum mă ajută această pagină?',
                'paragraphs' => [
                    'Pagina Psihologi este locul în care utilizatorul descoperă specialiștii disponibili și poate evalua opțiunile relevante pentru nevoile sale.',
                    'Avantajul este că platforma centralizează într-un singur loc specialiști, profiluri și traseul către programare.',
                ],
            ],
            [
                'heading' => 'Programări: ce pot face aici?',
                'paragraphs' => [
                    'Pagina Programări este destinată administrării interacțiunilor cu specialiștii. Aici pot apărea disponibilități, solicitări, statusuri și remindere legate de întâlniri.',
                    'Beneficiul este organizarea într-un singur loc a etapelor legate de programări, fără fragmentarea informației.',
                ],
            ],
            [
                'heading' => 'Jurnal: de ce este util?',
                'paragraphs' => [
                    'Jurnalul permite notarea stărilor, contextelor și observațiilor personale. Este util pentru urmărirea evoluției în timp și pentru clarificarea tiparelor emoționale sau de comportament.',
                    'Avantajul major este continuitatea: utilizatorul poate observa schimbări, poate reveni la intrări mai vechi și își poate construi o imagine mai clară despre propriul parcurs.',
                ],
            ],
            [
                'heading' => 'Notificări: ce rol au în aplicație?',
                'paragraphs' => [
                    'Pagina Notificări centralizează remindere, evenimente relevante și alte informări generate de sistem. Ea ajută utilizatorul să nu piardă repere importante legate de activitatea sa în platformă.',
                    'Dacă notificările sunt dezactivate din Settings, această zonă nu mai afișează feed-ul activ.',
                ],
            ],
            [
                'heading' => 'Profil: ce găsesc în această pagină?',
                'paragraphs' => [
                    'Pagina Profil concentrează informații despre utilizator, activitatea sa în aplicație și legături utile către zone precum articole favorite, remindere sau alte repere personale.',
                    'Scopul ei este să ofere un punct central pentru identitate, progres și acces rapid la funcționalitățile cele mai personale.',
                ],
            ],
            [
                'heading' => 'Settings: ce pot controla din Setări?',
                'paragraphs' => [
                    'Din Settings utilizatorul poate controla preferințe precum tema, notificările și accesul la documentele despre confidențialitate, tehnic, termeni sau suport.',
                    'Avantajul este controlul clar asupra experienței în aplicație și accesul rapid la documentația explicativă.',
                ],
            ],
            [
                'heading' => 'Autentificare și recuperare parolă: de ce există aceste fluxuri?',
                'paragraphs' => [
                    'Fluxurile de autentificare, înregistrare, recuperare parolă și verificare a accesului au rolul de a proteja contul și de a păstra continuitatea datelor utilizatorului.',
                    'Ele sunt esențiale pentru sincronizare între dispozitive, siguranța accesului și păstrarea istoricului personal în platformă.',
                ],
            ],
        ];
    }
}
