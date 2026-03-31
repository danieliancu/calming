<?php

namespace App\Http\Controllers;

use App\Models\NotificationTemplate;
use App\Support\CommunityVisibilityService;
use App\Support\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SuperadminController extends Controller
{
    public function __construct(
        protected CommunityVisibilityService $communityVisibility,
    ) {
    }

    public function signinPage(Request $request): Response|RedirectResponse
    {
        if ($this->superadminFromSession($request)) {
            return redirect()->route('superadmin.dashboard');
        }

        return Inertia::render('Superadmin/Signin');
    }

    public function signin(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $superadmin = DB::table('superadmins')->where('username', $validated['username'])->first();

        if (! $superadmin || ! Hash::check($validated['password'], $superadmin->password_hash)) {
            return back()->withErrors([
                'username' => 'Autentificare esuata.',
            ])->onlyInput('username');
        }

        $request->session()->put('superadmin_id', $superadmin->id);
        $request->session()->regenerate();

        return redirect()->route('superadmin.dashboard');
    }

    public function signout(Request $request): RedirectResponse
    {
        $request->session()->forget('superadmin_id');

        return redirect()->route('superadmin.signin');
    }

    public function dashboard(Request $request): Response|RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $validationApplications = DB::table('psychologists as p')
            ->leftJoin('psychologist_validation_applications as pva', 'pva.psychologist_id', '=', 'p.id')
            ->leftJoin('psychologists_address as pa', 'pa.psychologist_id', '=', 'p.id')
            ->leftJoin('validation_entity_types as vet', 'vet.id', '=', 'pva.entity_type_id')
            ->leftJoin('psychologist_validation_locations as pvl', 'pvl.application_id', '=', 'pva.id')
            ->leftJoin('psychologist_individual_profiles as pip', 'pip.psychologist_id', '=', 'p.id')
            ->orderByRaw("
                CASE
                    WHEN pva.status = 'submitted' THEN 0
                    WHEN pva.status = 'rejected' THEN 1
                    WHEN pva.status = 'approved' THEN 2
                    WHEN pva.status = 'draft' THEN 3
                    ELSE 4
                END
            ")
            ->orderByDesc('pva.submitted_at')
            ->orderByDesc('pva.id')
            ->get([
                'pva.id as application_id',
                'pva.status',
                'pva.submitted_at',
                'pva.reviewed_at',
                'pva.reviewer_notes',
                'p.id as psychologist_id',
                'p.name',
                'p.surname',
                'p.email',
                'p.phone',
                'p.created_at as psychologist_created_at',
                'pa.city',
                'pa.county',
                'pa.address',
                'p.rupa_code',
                'vet.label as entity_type_label',
                'pvl.supports_online',
                'pvl.city_mode',
                'pvl.city as validation_city',
                'pvl.county as validation_county',
                'pvl.sector',
                'pip.clinical_competencies',
                'pip.public_bio',
            ])
            ->map(function ($item) {
                $attestations = [];
                $documents = [];
                $messages = [];

                if ($item->application_id) {
                    $attestations = DB::table('psychologist_validation_specialists as pvs')
                        ->leftJoin('professional_roles as pr', 'pr.id', '=', 'pvs.professional_role_id')
                        ->leftJoin('professional_grades as pg', 'pg.id', '=', 'pvs.professional_grade_id')
                        ->where('pvs.application_id', $item->application_id)
                        ->orderByDesc('pvs.is_primary')
                        ->orderBy('pvs.id')
                        ->get([
                            'pvs.id',
                            'pvs.is_primary',
                            'pr.label as professional_role',
                            'pg.label as professional_grade',
                            'pvs.practice_regime',
                            'pvs.license_number',
                            'pvs.license_issue_date',
                            'pvs.license_expiry_date',
                            'pvs.specialty_commission',
                            'pvs.clinical_competencies',
                            'pvs.description',
                        ])
                        ->map(function ($attestation) {
                            $specializations = DB::table('psychologist_validation_specialist_specializations')
                                ->where('specialist_id', $attestation->id)
                                ->orderBy('id')
                                ->pluck('label')
                                ->all();

                            return [
                                'id' => $attestation->id,
                                'is_primary' => (bool) $attestation->is_primary,
                                'professional_role' => $attestation->professional_role,
                                'professional_grade' => $attestation->professional_grade,
                                'practice_regime' => $attestation->practice_regime,
                                'license_number' => $attestation->license_number,
                                'license_issue_date' => $attestation->license_issue_date,
                                'license_expiry_date' => $attestation->license_expiry_date,
                                'specialty_commission' => $attestation->specialty_commission,
                                'clinical_competencies' => $attestation->clinical_competencies,
                                'description' => $attestation->description,
                                'specializations' => $specializations,
                            ];
                        })
                        ->all();

                    $documents = DB::table('psychologist_validation_documents')
                        ->where('application_id', $item->application_id)
                        ->orderByDesc('id')
                        ->get(['id', 'original_name', 'mime_type', 'size', 'disk', 'path'])
                        ->map(fn ($document) => [
                            'id' => $document->id,
                            'name' => $document->original_name,
                            'mime_type' => $document->mime_type,
                            'size' => $document->size,
                            'url' => \Illuminate\Support\Facades\Storage::disk($document->disk)->url($document->path),
                        ])
                        ->all();

                    $messages = DB::table('psychologist_validation_messages')
                        ->where('application_id', $item->application_id)
                        ->orderByDesc('id')
                        ->get(['id', 'message', 'created_at'])
                        ->map(fn ($message) => [
                            'id' => $message->id,
                            'message' => $message->message,
                            'created_at' => $message->created_at,
                        ])
                        ->all();
                }

                return [
                    'id' => $item->psychologist_id,
                    'application_id' => $item->application_id,
                    'status' => $item->status ?? 'draft',
                    'submitted_at' => $item->submitted_at ?? $item->psychologist_created_at,
                    'reviewed_at' => $item->reviewed_at,
                    'reviewer_notes' => $item->reviewer_notes,
                    'psychologist_id' => $item->psychologist_id,
                    'name' => trim(implode(' ', array_filter([$item->name, $item->surname]))),
                    'email' => $item->email,
                    'phone' => $item->phone,
                    'city' => $item->validation_city ?? $item->city,
                    'county' => $item->validation_county ?? $item->county,
                    'sector' => $item->sector,
                    'address' => $item->address,
                    'entity_type_label' => $item->entity_type_label,
                    'supports_online' => (bool) $item->supports_online,
                    'city_mode' => $item->city_mode,
                    'rupa_code' => $item->rupa_code,
                    'competencies' => $item->clinical_competencies,
                    'public_bio' => $item->public_bio,
                    'attestations' => $attestations,
                    'documents' => $documents,
                    'messages' => $messages,
                    'latest_message' => $messages[0]['message'] ?? null,
                ];
            })
            ->all();

        $pendingArticles = DB::table('articles as a')
            ->leftJoin('psychologists as p', 'p.id', '=', 'a.author')
            ->leftJoin('article_topics as at', 'at.id', '=', 'a.topic_id')
            ->leftJoin('articles_validation as av', 'av.article_id', '=', 'a.id')
            ->orderByDesc('a.updated_at')
            ->orderByDesc('a.id')
            ->get([
                'a.id',
                'a.title',
                'a.slug',
                'a.tag',
                'a.hero_image',
                'a.body',
                'a.updated_at',
                'a.guest_author_name',
                'at.name as topic_name',
                'av.is_valid',
                'p.name as author_name',
                'p.surname as author_surname',
            ])
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'tag' => $item->tag,
                'hero_image' => $item->hero_image,
                'body_preview' => $this->articlePreview($item->body),
                'updated_at' => $item->updated_at,
                'topic_name' => $item->topic_name,
                'author_name' => trim((string) ($item->guest_author_name ?: trim(implode(' ', array_filter([$item->author_name, $item->author_surname]))))) ?: 'Autor necunoscut',
                'author_type' => $item->guest_author_name ? 'guest' : 'specialist',
                'status' => is_null($item->is_valid) || ! (bool) $item->is_valid ? 'pending' : 'approved',
            ])
            ->all();

        $pendingSupportGroups = DB::table('community_groups as cg')
            ->leftJoin('community_groups_validation as cgv', 'cgv.group_id', '=', 'cg.id')
            ->join('psychologists as p', 'p.id', '=', 'cg.author')
            ->orderByDesc('cg.id')
            ->get([
                'cg.id',
                'cg.name',
                'cg.slug',
                'cg.description',
                'cg.schedule',
                'cg.is_private',
                'cgv.updated_at as queued_at',
                'cgv.is_valid',
                'cgv.reviewer_notes',
                'p.name as author_name',
                'p.surname as author_surname',
            ])
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'description' => $item->description,
                'schedule' => $item->schedule,
                'is_private' => (bool) $item->is_private,
                'queued_at' => $item->queued_at,
                'reviewer_notes' => $item->reviewer_notes,
                'author_name' => trim(implode(' ', array_filter([$item->author_name, $item->author_surname]))),
                'status' => is_null($item->is_valid) || ! (bool) $item->is_valid ? 'pending' : 'approved',
            ])
            ->all();

        $stats = [
            'specialists_total' => DB::table('psychologists')->count(),
            'specialists_approved' => DB::table('psychologist_validation_applications')->where('status', 'approved')->count(),
            'users_total' => DB::table('users')->count(),
            'validation_pending' => DB::table('psychologist_validation_applications')->where('status', 'submitted')->count(),
            'articles_pending' => DB::table('articles as a')
                ->leftJoin('articles_validation as av', 'av.article_id', '=', 'a.id')
                ->where(function ($query) {
                    $query->whereNull('av.article_id')->orWhere('av.is_valid', false);
                })
                ->count(),
            'support_groups_pending' => $this->communityVisibility
                ->applyPendingReviewScope(DB::table('community_groups as cg'), 'cg')
                ->count(),
        ];

        $users = DB::table('users')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get([
                'id',
                'first_name',
                'last_name',
                'name',
                'email',
                'phone',
                'city',
                'country',
                'language',
                'notifications_enabled',
                'email_verified_at',
                'created_at',
            ])
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => trim((string) implode(' ', array_filter([$item->first_name, $item->last_name]))) ?: ($item->name ?: 'Utilizator fără nume'),
                'email' => $item->email,
                'phone' => $item->phone,
                'city' => $item->city,
                'country' => $item->country,
                'language' => $item->language,
                'notifications_enabled' => (bool) ($item->notifications_enabled ?? true),
                'email_verified_at' => $item->email_verified_at,
                'created_at' => $item->created_at,
            ])
            ->all();

        $categories = DB::table('article_topics as at')
            ->leftJoin('articles as a', 'a.topic_id', '=', 'at.id')
            ->selectRaw('at.id, at.name, at.slug, COUNT(a.id) as article_count')
            ->groupBy('at.id', 'at.name', 'at.slug')
            ->orderBy('at.name')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'article_count' => (int) $item->article_count,
            ])
            ->all();

        $notificationTemplates = DB::table('notification_templates')
            ->orderBy('category')
            ->orderBy('key')
            ->get()
            ->map(function ($template) {
                $notificationCount = DB::table('notifications')->where('template_id', $template->id)->count();
                $userCount = DB::table('notifications')->where('template_id', $template->id)->where('recipient_type', 'user')->count();
                $guestCount = DB::table('notifications')->where('template_id', $template->id)->where('recipient_type', 'guest')->count();
                $latest = DB::table('notifications')
                    ->where('template_id', $template->id)
                    ->orderByDesc('published_at')
                    ->first(['title', 'body', 'recipient_type', 'published_at']);

                return [
                    'id' => $template->id,
                    'key' => $template->key,
                    'title' => $template->default_title ?: $template->title,
                    'body' => $template->default_body ?: $template->message,
                    'actor_type' => $template->actor_type,
                    'audience' => $template->audience,
                    'category' => $template->category,
                    'icon' => $template->icon,
                    'icon_color' => $template->icon_color ?: $template->accent,
                    'priority' => (int) ($template->priority ?? 3),
                    'cta_kind' => $template->cta_kind,
                    'cta_label' => $template->cta_label,
                    'deep_link' => $template->deep_link,
                    'is_repeatable' => (bool) ($template->is_repeatable ?? false),
                    'is_active' => (bool) ($template->is_active ?? true),
                    'frequency_total' => $notificationCount,
                    'frequency_user' => $userCount,
                    'frequency_guest' => $guestCount,
                    'latest_delivery' => $latest ? [
                        'title' => $latest->title,
                        'body' => $latest->body,
                        'recipient_type' => $latest->recipient_type,
                        'published_at' => $latest->published_at,
                    ] : null,
                ];
            })
            ->values()
            ->all();

        $notificationEvents = DB::table('notifications')
            ->selectRaw('id, recipient_type, category, title, body, status, trigger_type, trigger_id, cta_kind, published_at, read_at, dedupe_key, user_id, guest_token')
            ->orderByDesc('published_at')
            ->limit(50)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'recipient_type' => $item->recipient_type,
                'category' => $item->category,
                'title' => $item->title,
                'body' => $item->body,
                'status' => $item->status,
                'trigger_type' => $item->trigger_type,
                'trigger_id' => $item->trigger_id,
                'cta_kind' => $item->cta_kind,
                'published_at' => $item->published_at,
                'read_at' => $item->read_at,
                'dedupe_key' => $item->dedupe_key,
                'appears_for' => $item->recipient_type === 'user'
                    ? ($item->user_id ? "user #{$item->user_id}" : 'user')
                    : ($item->guest_token ? 'guest token' : 'all guests'),
            ])
            ->all();

        $notificationSummary = [
            'templates_total' => DB::table('notification_templates')->count(),
            'deliveries_total' => DB::table('notifications')->count(),
            'deliveries_user' => DB::table('notifications')->where('recipient_type', 'user')->count(),
            'deliveries_guest' => DB::table('notifications')->where('recipient_type', 'guest')->count(),
            'unread_total' => DB::table('notifications')->where('status', 'unread')->count(),
            'repeatable_total' => DB::table('notification_templates')->where('is_repeatable', true)->count(),
        ];

        return Inertia::render('Superadmin/Dashboard', [
            'superadmin' => [
                'id' => $superadmin->id,
                'username' => $superadmin->username,
            ],
            'stats' => $stats,
            'validationApplications' => $validationApplications,
            'pendingArticles' => $pendingArticles,
            'pendingSupportGroups' => $pendingSupportGroups,
            'users' => $users,
            'categories' => $categories,
            'notificationTemplates' => $notificationTemplates,
            'notificationEvents' => $notificationEvents,
            'notificationSummary' => $notificationSummary,
        ]);
    }

    public function createDirectArticlePage(Request $request): Response|RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        return Inertia::render('AssistantArticleNew', [
            'topics' => $this->articleTopics(),
        ]);
    }

    public function storeDirectArticle(Request $request): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

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

            app(NotificationService::class)->publishBroadcast('article_published', [
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

    public function editArticlePage(Request $request, int $articleId): Response|RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $article = DB::table('articles')
            ->where('id', $articleId)
            ->whereNotNull('guest_author_name')
            ->first(['id', 'title', 'tag', 'body', 'hero_image', 'topic_id', 'guest_author_name']);

        abort_unless($article, 404);

        return Inertia::render('Superadmin/Articles/Edit', [
            'topics' => $this->articleTopics(),
            'article' => [
                'id' => $article->id,
                'author_name' => $article->guest_author_name,
                'title' => $article->title,
                'tag' => $article->tag,
                'body' => $this->normalizeArticleEditorBody($article->body),
                'hero_image' => $article->hero_image,
                'topic_id' => $article->topic_id,
            ],
        ]);
    }

    public function updateArticle(Request $request, int $articleId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $article = DB::table('articles')
            ->where('id', $articleId)
            ->whereNotNull('guest_author_name')
            ->first();
        abort_unless($article, 404);

        $validated = $request->validate([
            'author_name' => ['required', 'string', 'max:150'],
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['required', 'string', 'max:120'],
            'topic_id' => ['required', 'integer', 'exists:article_topics,id'],
            'body' => ['required', 'string'],
            'hero_image' => ['nullable', 'image', 'max:5120'],
        ]);

        $heroImageUrl = $article->hero_image;

        if ($request->hasFile('hero_image')) {
            $imagePath = $request->file('hero_image')->store('article-images', 'public');
            $heroImageUrl = $this->articleImagePath($imagePath);
        }

        DB::table('articles')->where('id', $articleId)->update([
            'title' => $validated['title'],
            'slug' => $this->uniqueArticleSlug($validated['title'], $articleId),
            'tag' => $validated['tag'],
            'minutes' => $this->estimateArticleReadingMinutes($validated['body']),
            'hero_image' => $heroImageUrl,
            'guest_author_name' => trim($validated['author_name']),
            'body' => json_encode($validated['body']),
            'is_recommended' => true,
            'topic_id' => $validated['topic_id'],
            'updated_at' => now(),
        ]);

        DB::table('articles_validation')->updateOrInsert(
            ['article_id' => $articleId],
            ['is_valid' => true, 'validated_at' => now()]
        );

        return redirect()
            ->route('superadmin.articles.edit', ['articleId' => $articleId])
            ->with('status', 'Modificarile au fost salvate.');
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:80', 'unique:superadmins,username,'.$superadmin->id],
            'current_password' => ['required', 'string'],
            'password' => ['nullable', 'confirmed', Password::min(6)],
        ]);

        if (! Hash::check($validated['current_password'], $superadmin->password_hash)) {
            return back()->withErrors([
                'current_password' => 'Parola curenta este invalida.',
            ]);
        }

        $payload = [
            'username' => $validated['username'],
            'updated_at' => now(),
        ];

        if (! empty($validated['password'])) {
            $payload['password_hash'] = Hash::make($validated['password']);
        }

        DB::table('superadmins')->where('id', $superadmin->id)->update($payload);

        return back()->with('status', 'Profilul de superadmin a fost actualizat.');
    }

    public function approveValidationApplication(Request $request, int $applicationId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        DB::table('psychologist_validation_applications')
            ->where('id', $applicationId)
            ->update([
                'status' => 'approved',
                'reviewed_at' => now(),
                'reviewer_notes' => null,
                'updated_at' => now(),
            ]);

        return back()->with('status', 'Cererea de validare a fost aprobata.');
    }

    public function rejectValidationApplication(Request $request, int $applicationId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $validated = $request->validate([
            'reviewer_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::table('psychologist_validation_applications')
            ->where('id', $applicationId)
            ->update([
                'status' => 'rejected',
                'reviewed_at' => now(),
                'reviewer_notes' => $validated['reviewer_notes'] ?? null,
                'updated_at' => now(),
            ]);

        return back()->with('status', 'Cererea de validare a fost respinsa.');
    }

    public function storeValidationMessage(Request $request, int $applicationId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ], [
            'message.required' => 'Completeaza mesajul pentru specialist.',
            'message.max' => 'Mesajul poate avea maximum 1000 de caractere.',
        ]);

        $applicationExists = DB::table('psychologist_validation_applications')->where('id', $applicationId)->exists();
        abort_unless($applicationExists, 404);

        DB::table('psychologist_validation_messages')->insert([
            'application_id' => $applicationId,
            'superadmin_id' => $superadmin->id,
            'message' => $validated['message'],
            'created_at' => now(),
        ]);

        return back()->with('status', 'Mesajul a fost trimis catre specialist.');
    }

    public function destroyValidationMessage(Request $request, int $applicationId, int $messageId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $deleted = DB::table('psychologist_validation_messages')
            ->where('id', $messageId)
            ->where('application_id', $applicationId)
            ->delete();

        abort_unless($deleted, 404);

        return back()->with('status', 'Mesajul a fost sters.');
    }

    public function destroyPsychologist(Request $request, int $psychologistId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $psychologist = DB::table('psychologists')
            ->where('id', $psychologistId)
            ->first(['id', 'name', 'surname', 'email']);

        abort_unless($psychologist, 404);

        DB::transaction(function () use ($psychologistId) {
            $groupIds = DB::table('community_groups')
                ->where('author', $psychologistId)
                ->pluck('id');

            if ($groupIds->isNotEmpty()) {
                DB::table('community_group_invitations')->whereIn('group_id', $groupIds)->delete();
                DB::table('community_groups_validation')->whereIn('group_id', $groupIds)->delete();
            }

            DB::table('psychologists')->where('id', $psychologistId)->delete();
        });

        $displayName = trim(implode(' ', array_filter([$psychologist->name, $psychologist->surname]))) ?: $psychologist->email;

        return back()->with('status', "Contul specialistului {$displayName} a fost sters.");
    }

    public function approveArticle(Request $request, int $articleId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

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

            app(NotificationService::class)->publishBroadcast('article_published', [
                'title' => 'Articol nou in biblioteca',
                'body' => $article->title,
                'trigger_type' => 'article',
                'trigger_id' => (string) $article->id,
                'dedupe_key' => "article_published:{$article->id}",
                'cta_kind' => 'open',
                'cta_payload' => ['href' => "/article/{$article->slug}", 'label' => 'Citeste articolul'],
            ]);
        }

        return back()->with('status', 'Articolul a fost aprobat.');
    }

    public function storeArticleCategory(Request $request): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:150', 'unique:article_topics,slug'],
        ], [
            'name.required' => 'Completeaza numele categoriei.',
            'slug.unique' => 'Slug-ul categoriei exista deja.',
        ]);

        DB::table('article_topics')->insert([
            'name' => $validated['name'],
            'slug' => $this->uniqueArticleCategorySlug($validated['slug'] ?? $validated['name']),
        ]);

        return back()->with('status', 'Categoria a fost adăugată.');
    }

    public function updateArticleCategory(Request $request, int $categoryId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:150', 'unique:article_topics,slug,'.$categoryId],
        ], [
            'name.required' => 'Completeaza numele categoriei.',
            'slug.unique' => 'Slug-ul categoriei exista deja.',
        ]);

        DB::table('article_topics')
            ->where('id', $categoryId)
            ->update([
                'name' => $validated['name'],
                'slug' => $this->uniqueArticleCategorySlug($validated['slug'] ?? $validated['name'], $categoryId),
            ]);

        return back()->with('status', 'Categoria a fost actualizata.');
    }

    public function destroyArticleCategory(Request $request, int $categoryId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $articleCount = DB::table('articles')->where('topic_id', $categoryId)->count();

        if ($articleCount > 0) {
            return back()->withErrors([
                'category' => 'Categoria nu poate fi stearsa cat timp are articole asociate.',
            ]);
        }

        $deleted = DB::table('article_topics')->where('id', $categoryId)->delete();
        abort_unless($deleted, 404);

        return back()->with('status', 'Categoria a fost stearsa.');
    }

    public function rejectArticle(Request $request, int $articleId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        DB::table('articles_validation')->updateOrInsert(
            ['article_id' => $articleId],
            ['is_valid' => false, 'validated_at' => null]
        );

        return back()->with('status', 'Articolul a fost lasat in asteptare.');
    }

    public function destroyArticle(Request $request, int $articleId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $article = DB::table('articles')->where('id', $articleId)->first(['id', 'title']);
        abort_unless($article, 404);

        DB::transaction(function () use ($articleId) {
            DB::table('notifications')
                ->where('trigger_type', 'article')
                ->where('trigger_id', (string) $articleId)
                ->delete();

            DB::table('articles')->where('id', $articleId)->delete();
        });

        return back()->with('status', "Articolul \"{$article->title}\" a fost sters.");
    }

    public function approveCommunityGroup(Request $request, int $groupId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        DB::table('community_groups_validation')->updateOrInsert(
            ['group_id' => $groupId],
            [
                'is_valid' => true,
                'validated_at' => now(),
                'reviewer_notes' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        return back()->with('status', 'Grupul de sprijin a fost aprobat.');
    }

    public function rejectCommunityGroup(Request $request, int $groupId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $validated = $request->validate([
            'reviewer_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::table('community_groups_validation')->updateOrInsert(
            ['group_id' => $groupId],
            [
                'is_valid' => false,
                'validated_at' => null,
                'reviewer_notes' => $validated['reviewer_notes'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        return back()->with('status', 'Grupul de sprijin a ramas in asteptare.');
    }

    public function destroyCommunityGroup(Request $request, int $groupId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $group = DB::table('community_groups')->where('id', $groupId)->first(['id', 'name']);
        abort_unless($group, 404);

        DB::transaction(function () use ($groupId) {
            DB::table('community_groups_validation')->where('group_id', $groupId)->delete();

            DB::table('notifications')
                ->where('trigger_type', 'community_group')
                ->where('trigger_id', (string) $groupId)
                ->delete();

            DB::table('community_groups')->where('id', $groupId)->delete();
        });

        return back()->with('status', "Grupul \"{$group->name}\" a fost șters.");
    }

    public function updateNotificationTemplate(Request $request, int $templateId): RedirectResponse
    {
        $superadmin = $this->requireSuperadminSession($request);

        if ($superadmin instanceof RedirectResponse) {
            return $superadmin;
        }

        $template = NotificationTemplate::query()->findOrFail($templateId);

        $validated = $request->validate([
            'default_title' => ['required', 'string', 'max:200'],
            'default_body' => ['required', 'string', 'max:2000'],
            'audience' => ['required', Rule::in(['general', 'authenticated'])],
            'actor_type' => ['required', Rule::in(['guest', 'user', 'both'])],
            'category' => ['required', Rule::in(['reminder', 'assistant', 'community', 'article', 'appointment', 'journal', 'milestone', 'profile', 'product', 'stats'])],
            'icon' => ['required', Rule::in(['FiBell', 'FiBookOpen', 'FiBookmark', 'FiCalendar', 'FiClock', 'FiHeart', 'FiMapPin', 'FiMessageCircle', 'FiMessageSquare', 'FiTrendingUp', 'FiUser', 'FiUsers', 'FiAward'])],
            'icon_color' => ['required', Rule::in(['rose', 'mint', 'lilac', 'amber', 'sky', 'peach', 'coral', 'indigo'])],
            'priority' => ['required', 'integer', 'between:1,5'],
            'cta_kind' => ['nullable', Rule::in(['open', 'save', 'snooze', 'disable'])],
            'cta_label' => ['nullable', 'string', 'max:120'],
            'deep_link' => ['nullable', 'string', 'max:255'],
            'is_repeatable' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ]);

        $template->update([
            'title' => $validated['default_title'],
            'message' => $validated['default_body'],
            'default_title' => $validated['default_title'],
            'default_body' => $validated['default_body'],
            'audience' => $validated['audience'],
            'actor_type' => $validated['actor_type'],
            'category' => $validated['category'],
            'icon' => $validated['icon'],
            'icon_color' => $validated['icon_color'],
            'accent' => $validated['icon_color'],
            'priority' => $validated['priority'],
            'cta_kind' => $validated['cta_kind'] ?: null,
            'cta_label' => $validated['cta_label'] ?: null,
            'deep_link' => $validated['deep_link'] ?: null,
            'is_repeatable' => (bool) $validated['is_repeatable'],
            'is_active' => (bool) $validated['is_active'],
        ]);

        return back()->with('status', 'Template-ul de notificare a fost actualizat.');
    }

    protected function requireSuperadminSession(Request $request): mixed
    {
        $superadmin = $this->superadminFromSession($request);

        if (! $superadmin) {
            $request->session()->forget('superadmin_id');

            return redirect()->route('superadmin.signin');
        }

        return $superadmin;
    }

    protected function superadminFromSession(Request $request): ?object
    {
        $superadminId = (int) $request->session()->get('superadmin_id');

        if ($superadminId <= 0) {
            return null;
        }

        return DB::table('superadmins')->where('id', $superadminId)->first();
    }

    protected function articlePreview(?string $body): string
    {
        if (! $body) {
            return '';
        }

        $decoded = json_decode($body, true);

        if (is_string($decoded)) {
            return trim(str(strip_tags($decoded))->limit(180, '...')->toString());
        }

        if (is_array($decoded)) {
            $text = implode(' ', array_map(fn ($item) => is_string($item) ? trim(strip_tags($item)) : '', $decoded));

            return trim(str($text)->limit(180, '...')->toString());
        }

        return trim(str(strip_tags($body))->limit(180, '...')->toString());
    }

    protected function normalizeArticleEditorBody(?string $body): string
    {
        if (! $body) {
            return '';
        }

        $decoded = json_decode($body, true);

        if (is_array($decoded)) {
            $items = array_values(array_filter($decoded, fn ($item) => is_string($item) && trim($item) !== ''));

            return $items === []
                ? ''
                : '<p>'.implode('</p><p>', array_map(fn ($item) => trim($item), $items)).'</p>';
        }

        if (is_string($decoded)) {
            return $decoded;
        }

        return $body;
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

    protected function uniqueArticleCategorySlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: 'categorie';
        $slug = $base;
        $suffix = 2;

        while (
            DB::table('article_topics')
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
