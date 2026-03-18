<?php

namespace App\Support;

use App\Models\AssistantMessage;
use App\Models\AssistantMemory;
use App\Models\AssistantThread;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AssistantService
{
    public function __construct(
        protected AssistantPromptBuilder $promptBuilder,
        protected AssistantMemoryService $memoryService,
        protected NotificationService $notifications,
    ) {
    }

    public function bootstrap(?User $user = null): array
    {
        if (! $user) {
            Log::debug('AssistantService.bootstrap: no user (guest mode)');
            return [
                'guest_mode' => true,
                'profile' => $this->defaultGuestProfile(),
                'thread' => null,
                'messages' => [],
                'limits' => [
                    'max_guest_messages' => (int) config('assistant.max_guest_messages', 12),
                    'max_message_chars' => (int) config('assistant.max_message_chars', 1500),
                ],
                'assistant_preferences' => [
                    'allow_assistant' => true,
                    'digest_frequency' => 'daily',
                    'check_in_window' => 'morning',
                ],
            ];
        }

        $storageReady = $this->assistantStorageReady();
        Log::debug('AssistantService.bootstrap: storage ready', ['ready' => $storageReady, 'user_id' => $user->id]);

        $thread = $storageReady ? $this->activeThreadForUser($user) : null;
        $profile = $this->profileContextForUser($user->id);
        $preferences = $this->assistantPreferencesForUser($user->id);
        $memory = $storageReady ? AssistantMemory::query()->where('user_id', $user->id)->first() : null;

        $this->syncNotificationsForUser($user, $preferences, $thread);

        $messages = $thread
            ? $this->serializeMessages($thread->messages()->orderBy('id')->limit(30)->get())
            : [];

        Log::debug('AssistantService.bootstrap: returning data', [
            'guest_mode' => false,
            'thread_id' => $thread?->id,
            'message_count' => count($messages),
            'messages_is_array' => is_array($messages),
            'first_message_has_content' => isset($messages[0]) && !empty($messages[0]['content']),
        ]);

        return [
            'guest_mode' => false,
            'profile' => $profile,
            'thread' => $thread ? [
                'id' => $thread->id,
                'status' => $thread->status,
                'summary_text' => $thread->summary_text,
                'last_activity_at' => optional($thread->last_activity_at)->toIso8601String(),
                'message_count' => $thread->message_count,
                'memory_summary' => $memory?->memory_summary,
            ] : null,
            'messages' => $messages,
            'limits' => [
                'max_guest_messages' => (int) config('assistant.max_guest_messages', 12),
                'max_message_chars' => (int) config('assistant.max_message_chars', 1500),
            ],
            'assistant_preferences' => $preferences,
        ];
    }

    public function history(User $user, int $limit = 40): array
    {
        if (! $this->assistantStorageReady()) {
            return [];
        }

        $thread = $this->activeThreadForUser($user);

        return $this->serializeMessages(
            $thread->messages()->orderByDesc('id')->limit($limit)->get()->reverse()->values()
        );
    }

    public function startNewConversation(?User $user = null): array
    {
        if (! $user || ! $this->assistantStorageReady()) {
            return $this->bootstrap($user);
        }

        DB::transaction(function () use ($user) {
            AssistantThread::query()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'archived',
                    'updated_at' => now(),
                ]);

            AssistantThread::query()->create([
                'user_id' => $user->id,
                'status' => 'active',
                'last_activity_at' => now(),
                'profile_snapshot' => $this->profileContextForUser($user->id),
                'message_count' => 0,
                'summary_text' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return $this->bootstrap($user);
    }

    public function respondAsUser(User $user, string $content): array
    {
        $messageText = $this->normalizeMessage($content);
        $profile = $this->profileContextForUser($user->id);

        if (! $this->assistantStorageReady()) {
            $reply = $this->generateReply(
                messages: collect([['role' => 'user', 'content' => $messageText]]),
                profile: $profile,
                memory: null,
                guest: false,
            );

            return [
                'thread' => null,
                'message' => [
                    'id' => 'transient-assistant',
                    'role' => 'assistant',
                    'content' => $reply['content'],
                    'status' => 'completed',
                    'safety_state' => $reply['safety_state'] ?? 'fallback',
                    'created_at' => now()->toIso8601String(),
                ],
                'user_message' => [
                    'id' => 'transient-user',
                    'role' => 'user',
                    'content' => $messageText,
                    'status' => 'completed',
                    'safety_state' => 'ok',
                    'created_at' => now()->toIso8601String(),
                ],
                'memory_summary' => null,
            ];
        }

        $thread = $this->activeThreadForUser($user);

        return DB::transaction(function () use ($user, $thread, $profile, $messageText) {
            $userMessage = AssistantMessage::query()->create([
                'thread_id' => $thread->id,
                'role' => 'user',
                'content' => $messageText,
                'status' => 'completed',
                'safety_state' => 'ok',
                'created_at' => now(),
            ]);

            $recentMessages = $thread->messages()
                ->whereIn('role', ['user', 'assistant'])
                ->orderByDesc('id')
                ->limit((int) config('assistant.recent_message_limit', 10))
                ->get()
                ->reverse()
                ->values();

            $memory = AssistantMemory::query()->where('user_id', $user->id)->first();
            $reply = $this->generateReply(
                messages: $recentMessages->map(fn (AssistantMessage $message) => [
                    'role' => $message->role,
                    'content' => $message->content,
                ]),
                profile: $profile,
                memory: $memory?->toArray(),
                guest: false,
            );

            $assistantMessage = AssistantMessage::query()->create([
                'thread_id' => $thread->id,
                'role' => 'assistant',
                'content' => $reply['content'],
                'input_tokens' => $reply['input_tokens'] ?? null,
                'output_tokens' => $reply['output_tokens'] ?? null,
                'model' => $reply['model'] ?? config('assistant.model'),
                'status' => 'completed',
                'safety_state' => $reply['safety_state'] ?? 'ok',
                'created_at' => now(),
            ]);

            $thread->update([
                'last_activity_at' => now(),
                'profile_snapshot' => $profile,
                'message_count' => $thread->messages()->count(),
                'summary_text' => $memory?->memory_summary,
                'updated_at' => now(),
            ]);

            $refreshedMemory = $this->memoryService->refreshForThread($thread->fresh('messages'), $profile);
            if ($refreshedMemory?->memory_summary) {
                $thread->update(['summary_text' => $refreshedMemory->memory_summary]);
            }

            return [
                'thread' => [
                    'id' => $thread->id,
                    'message_count' => (int) $thread->fresh()->message_count,
                ],
                'message' => $this->serializeMessage($assistantMessage),
                'user_message' => $this->serializeMessage($userMessage),
                'memory_summary' => $refreshedMemory?->memory_summary,
            ];
        });
    }

    public function respondAsGuest(array $guestProfile, array $messages, int $sessionMessageCount): array
    {
        $maxMessages = (int) config('assistant.max_guest_messages', 12);
        if ($sessionMessageCount >= $maxMessages) {
            return [
                'limit_reached' => true,
                'message' => [
                    'id' => 'guest-limit',
                    'role' => 'assistant',
                    'content' => 'Ai ajuns la limita acestei sesiuni. Creeaza-ti un cont pentru a pastra istoricul si pentru a continua cu un assistant personalizat.',
                    'status' => 'completed',
                    'safety_state' => 'limit_reached',
                    'created_at' => now()->toIso8601String(),
                ],
            ];
        }

        $normalizedMessages = collect($messages)
            ->filter(fn ($message) => in_array($message['role'] ?? '', ['user', 'assistant'], true))
            ->take(-(int) config('assistant.recent_message_limit', 10))
            ->values();

        $reply = $this->generateReply(
            messages: $normalizedMessages,
            profile: $this->normalizeGuestProfile($guestProfile),
            memory: null,
            guest: true,
        );

        return [
            'limit_reached' => false,
            'message' => [
                'id' => 'guest-'.Str::uuid(),
                'role' => 'assistant',
                'content' => $reply['content'],
                'status' => 'completed',
                'safety_state' => $reply['safety_state'] ?? 'ok',
                'created_at' => now()->toIso8601String(),
            ],
            'usage' => [
                'session_message_count' => $sessionMessageCount + 1,
                'max_guest_messages' => $maxMessages,
            ],
        ];
    }

    public function activeThreadForUser(User $user): AssistantThread
    {
        $thread = AssistantThread::query()->firstOrCreate(
            ['user_id' => $user->id, 'status' => 'active'],
            [
                'last_activity_at' => now(),
                'profile_snapshot' => $this->profileContextForUser($user->id),
                'message_count' => 0,
            ]
        );

        Log::debug('activeThreadForUser', [
            'user_id' => $user->id,
            'thread_id' => $thread->id,
            'message_count' => $thread->messages()->count(),
        ]);

        return $thread;
    }

    protected function generateReply(Collection $messages, array $profile, ?array $memory, bool $guest): array
    {
        $lastUser = $messages->filter(fn ($message) => ($message['role'] ?? null) === 'user')->last();
        $lastUserMessage = (string) ($lastUser['content'] ?? '');
        $userTurnCount = $messages->filter(fn ($message) => ($message['role'] ?? null) === 'user')->count();

        if ($this->detectCrisis($lastUserMessage)) {
            return [
                'content' => 'Imi pare rau ca treci prin asta. Nu pot ajuta suficient intr-o situatie de risc. Te rog contacteaza imediat o persoana de incredere, un specialist sau serviciile de urgenta din zona ta. Daca esti in pericol imediat, suna acum la 112. Daca vrei, poti sa imi spui doar daca esti in siguranta in acest moment.',
                'model' => 'safety-escalation',
                'safety_state' => 'crisis_escalated',
                'input_tokens' => null,
                'output_tokens' => null,
            ];
        }

        $systemPrompt = $this->promptBuilder->systemPrompt($profile, $memory, $guest);
        $input = $this->promptBuilder->responseInput($systemPrompt, $messages);
        $apiKey = (string) config('assistant.api_key');

        if ($apiKey !== '') {
            try {
                $response = Http::withToken($apiKey)
                    ->timeout(30)
                    ->post('https://api.openai.com/v1/responses', [
                        'model' => config('assistant.model'),
                        'input' => $input,
                        'max_output_tokens' => (int) config('assistant.max_output_tokens', 180),
                    ])
                    ->throw()
                    ->json();

                $content = data_get($response, 'output_text')
                    ?? data_get($response, 'output.0.content.0.text')
                    ?? data_get($response, 'output.0.content.0.value');

                if (is_string($content) && trim($content) !== '') {
                    return [
                        'content' => trim($content),
                        'model' => data_get($response, 'model', config('assistant.model')),
                        'safety_state' => 'ok',
                        'input_tokens' => data_get($response, 'usage.input_tokens'),
                        'output_tokens' => data_get($response, 'usage.output_tokens'),
                    ];
                }
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return [
            'content' => $this->localFallbackReply($lastUserMessage, $profile, $guest, $userTurnCount),
            'model' => 'local-fallback',
            'safety_state' => 'fallback',
            'input_tokens' => null,
            'output_tokens' => null,
        ];
    }

    protected function localFallbackReply(string $message, array $profile, bool $guest, int $userTurnCount = 1): string
    {
        $normalized = Str::of($message)->lower()->squish()->value();

        if ($normalized === '' || preg_match('/^(salut|hello|hei|buna|buna ziua|good morning|good evening)$/', $normalized)) {
            return 'Sigur. Ce te apasa cel mai tare acum?';
        }

        if (preg_match('/(vreau sa vorb|as vrea sa vorb|vreau doar sa vorb|am nevoie sa vorb|pot sa vorbesc)/', $normalized)) {
            return 'Sigur. Sunt aici. Spune-mi ce e cel mai greu pentru tine acum.';
        }

        if (preg_match('/(nu stiu cum sa ma descurc|nu mai stiu ce sa fac|nu stiu ce sa fac|nu ma descurc|sunt blocat|sunt blocata)/', $normalized)) {
            return 'Pare ca esti coplesit acum. Nu trebuie sa rezolvi tot dintr-o data. Care e problema cea mai urgenta dintre toate?';
        }

        if (preg_match('/(atac de panica|panica|atac de inima|infarct|o sa mor|mor imediat|frica ca mor|frica ca o sa mor)/', $normalized)) {
            return trim(implode(' ', array_filter([
                'Ce descrii suna foarte aproape de panica sau anxietate intensa, chiar daca senzatia din corp pare extrem de reala.',
                'Pentru moment, spune-mi: ce simti cel mai puternic acum in corp, iar apoi luam pas cu pas ce inseamna asta.',
            ])));
        }

        if (preg_match('/\b(stres|stresat|stresata|agitat|agitata|anxios|anxioasa|coplesit|coplesita|obos|epuizat|epuizata)\b/', $normalized)) {
            return trim(implode(' ', array_filter([
                'Se simte multa tensiune in ce spui, iar asta poate face lucrurile sa para mai grele decat sunt pe moment.',
                'Hai sa alegem un singur lucru concret: ce anume te preseaza cel mai tare chiar astazi?',
            ])));
        }

        if (preg_match('/(nesimt|enerv|furios|furioasa|nervi|nervos|nervoasa|nedrept|frustrat|frustrata)/', $normalized)) {
            return trim(implode(' ', array_filter([
                'Se aude multa frustrare fata de comportamentul altora, iar reactia asta are sens.',
                'Ce te-a atins cel mai tare: lipsa de respect, tonul, sau faptul ca te-ai simtit trecut cu vederea?',
                'Dupa ce numim clar asta, alegem si o reactie care te protejeaza mai bine.',
            ])));
        }

        if (preg_match('/\b(somn|dorm|insomnie|noapte|trezesc|obos)\b/', $normalized)) {
            return trim(implode(' ', array_filter([
                'Cand somnul e afectat, si stresul de peste zi se amplifica usor.',
                'Vrei sa ne uitam mai intai la seara de dinainte, la gandurile care te tin treaz, sau la energia scazuta din timpul zilei?',
            ])));
        }

        return $userTurnCount <= 1
            ? 'Spune-mi pe scurt ce te apasa acum, iar apoi luam lucrurile pe rand.'
            : 'Hai sa luam un singur punct din tot ce se intampla. Care este partea cea mai grea chiar acum?';
    }

    protected function normalizeMessage(string $content): string
    {
        $message = trim(preg_replace('/\s+/', ' ', $content));
        abort_if($message === '', 422, 'Mesajul nu poate fi gol.');
        abort_if(Str::length($message) > (int) config('assistant.max_message_chars', 1500), 422, 'Mesajul este prea lung.');

        return $message;
    }

    protected function detectCrisis(string $message): bool
    {
        $text = Str::lower($message);
        foreach ([
            'sinucid', 'vreau sa mor', 'vreau sa ma omor', 'sa ma omor', 'nu mai vreau sa traiesc',
            'self harm', 'kill myself', 'suicide', 'hurt myself',
            'vreau sa dispar', 'ma ranesc', 'sa ma ranesc', 'vreau sa imi fac rau',
        ] as $pattern) {
            if (str_contains($text, $pattern)) {
                return true;
            }
        }

        return false;
    }

    public function profileContextForUser(int $userId): array
    {
        $profile = DB::table('user_profiles')->where('user_id', $userId)->first();
        $details = DB::table('user_profile_details')->where('user_id', $userId)->first();
        $hasAssistantOptIn = Schema::hasColumn('user_profile_details', 'assistant_opt_in');
        $hasPreferredLanguage = Schema::hasColumn('user_profile_details', 'preferred_language');

        return [
            'community_alias' => $profile->community_alias ?? null,
            'age_range' => $details->age_range ?? null,
            'focus_topics' => json_decode($details->focus_topics ?? '[]', true) ?: [],
            'primary_goal' => $details->primary_goal ?? null,
            'stress_triggers' => $details->stress_triggers ?? null,
            'coping_strategies' => $details->coping_strategies ?? null,
            'guidance_style' => $details->guidance_style ?? null,
            'guidance_style_label' => $this->guidanceStyleLabel($details->guidance_style ?? null),
            'check_in_preference' => $details->check_in_preference ?? null,
            'check_in_preference_label' => $this->checkInLabel($details->check_in_preference ?? null),
            'therapy_status' => $details->therapy_status ?? null,
            'therapy_status_label' => $this->therapyStatusLabel($details->therapy_status ?? null),
            'notification_frequency' => $details->notification_frequency ?? 'daily',
            'assistant_opt_in' => $hasAssistantOptIn ? (bool) ($details->assistant_opt_in ?? true) : true,
            'preferred_language' => $hasPreferredLanguage ? ($details->preferred_language ?? 'ro') : 'ro',
        ];
    }

    public function assistantPreferencesForUser(int $userId): array
    {
        $preferences = DB::table('notification_preferences')->where('user_id', $userId)->first();
        $profile = DB::table('user_profile_details')->where('user_id', $userId)->first();
        $hasCheckInWindow = Schema::hasColumn('notification_preferences', 'check_in_window');
        $hasAssistantOptIn = Schema::hasColumn('user_profile_details', 'assistant_opt_in');

        return [
            'allow_assistant' => (bool) ($preferences->allow_assistant ?? ($hasAssistantOptIn ? ($profile->assistant_opt_in ?? true) : true)),
            'digest_frequency' => $preferences->digest_frequency ?? $this->digestFrequency($profile->notification_frequency ?? 'daily'),
            'check_in_window' => $hasCheckInWindow ? ($preferences->check_in_window ?? ($profile->check_in_preference ?? 'morning')) : ($profile->check_in_preference ?? 'morning'),
            'notification_frequency' => $profile->notification_frequency ?? 'daily',
        ];
    }

    protected function serializeMessages(iterable $messages): array
    {
        return collect($messages)->map(fn (AssistantMessage $message) => $this->serializeMessage($message))->values()->all();
    }

    protected function serializeMessage(AssistantMessage $message): array
    {
        return [
            'id' => $message->id,
            'role' => $message->role,
            'content' => $message->content,
            'status' => $message->status,
            'safety_state' => $message->safety_state,
            'created_at' => optional($message->created_at)->toIso8601String(),
        ];
    }

    protected function defaultGuestProfile(): array
    {
        return [
            'community_alias' => '',
            'age_range' => '',
            'focus_topics' => [],
            'primary_goal' => '',
            'stress_triggers' => '',
            'coping_strategies' => '',
            'guidance_style' => 'calm-empathetic',
            'guidance_style_label' => $this->guidanceStyleLabel('calm-empathetic'),
            'check_in_preference' => 'morning',
            'check_in_preference_label' => $this->checkInLabel('morning'),
            'therapy_status' => '',
            'therapy_status_label' => '',
            'notification_frequency' => 'daily',
            'assistant_opt_in' => true,
            'preferred_language' => 'ro',
        ];
    }

    protected function normalizeGuestProfile(array $profile): array
    {
        $topics = collect($profile['focus_topics'] ?? $profile['focusTopics'] ?? [])
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->unique(fn ($item) => Str::lower($item))
            ->take(10)
            ->values()
            ->all();

        return [
            'community_alias' => trim((string) ($profile['community_alias'] ?? $profile['communityAlias'] ?? '')),
            'age_range' => trim((string) ($profile['age_range'] ?? $profile['ageRange'] ?? '')),
            'focus_topics' => $topics,
            'primary_goal' => trim((string) ($profile['primary_goal'] ?? $profile['primaryGoal'] ?? '')),
            'stress_triggers' => trim((string) ($profile['stress_triggers'] ?? $profile['stressTriggers'] ?? '')),
            'coping_strategies' => trim((string) ($profile['coping_strategies'] ?? $profile['copingStrategies'] ?? '')),
            'guidance_style' => (string) ($profile['guidance_style'] ?? $profile['guidanceStyle'] ?? 'calm-empathetic'),
            'guidance_style_label' => $this->guidanceStyleLabel($profile['guidance_style'] ?? $profile['guidanceStyle'] ?? 'calm-empathetic'),
            'check_in_preference' => (string) ($profile['check_in_preference'] ?? $profile['checkInPreference'] ?? 'morning'),
            'check_in_preference_label' => $this->checkInLabel($profile['check_in_preference'] ?? $profile['checkInPreference'] ?? 'morning'),
            'therapy_status' => (string) ($profile['therapy_status'] ?? $profile['therapyStatus'] ?? ''),
            'therapy_status_label' => $this->therapyStatusLabel($profile['therapy_status'] ?? $profile['therapyStatus'] ?? ''),
            'notification_frequency' => (string) ($profile['notification_frequency'] ?? $profile['notificationFrequency'] ?? 'daily'),
            'assistant_opt_in' => true,
            'preferred_language' => 'ro',
        ];
    }

    public function digestFrequency(?string $notificationFrequency): string
    {
        return match ($notificationFrequency) {
            'daily' => 'daily',
            'three-per-week' => 'balanced',
            'weekly' => 'weekly',
            'only-insights' => 'important-only',
            default => 'balanced',
        };
    }

    public function syncNotificationsForUser(User $user, ?array $preferences = null, ?AssistantThread $thread = null): void
    {
        $preferences ??= $this->assistantPreferencesForUser($user->id);
        $thread ??= AssistantThread::query()->where('user_id', $user->id)->where('status', 'active')->first();

        if (! ($preferences['allow_assistant'] ?? true)) {
            return;
        }

        if (! $this->isInsidePreferredWindow($preferences['check_in_window'] ?? 'morning')) {
            return;
        }

        $lastUserMessageAt = $thread?->messages()
            ->where('role', 'user')
            ->latest('id')
            ->value('created_at');
        $lastAssistantMessageAt = $thread?->messages()
            ->where('role', 'assistant')
            ->latest('id')
            ->value('created_at');

        $hours = match ($preferences['notification_frequency'] ?? 'daily') {
            'three-per-week' => 48,
            'weekly' => 168,
            'only-insights' => 120,
            default => 24,
        };

        if (! $lastUserMessageAt) {
            $this->notifications->publishToUser($user->id, 'assistant_tip_ready', [
                'title' => 'Assistant disponibil',
                'body' => 'Assistantul este pregatit sa porneasca de la profilul tau si sa iti ofere ghidaj personalizat.',
                'trigger_type' => 'assistant',
                'trigger_id' => (string) $user->id,
                'dedupe_key' => "assistant_tip_ready:{$user->id}",
                'cta_kind' => 'open',
                'cta_payload' => ['href' => '/assistant', 'label' => 'Deschide Assistant'],
            ]);

            return;
        }

        $lastUserAt = Carbon::parse($lastUserMessageAt);
        if ($lastUserAt->diffInHours(now()) < $hours) {
            if ($lastAssistantMessageAt && Carbon::parse($lastAssistantMessageAt)->diffInHours(now()) >= 24) {
                $this->notifications->publishToUser($user->id, 'assistant_follow_up', [
                    'title' => 'Follow-up Assistant',
                    'body' => 'Assistantul poate continua de unde ati ramas si iti poate propune urmatorul pas.',
                    'category' => 'assistant',
                    'icon' => 'FiMessageSquare',
                    'icon_color' => 'sky',
                    'trigger_type' => 'assistant_follow_up',
                    'trigger_id' => (string) $user->id,
                    'dedupe_key' => "assistant_follow_up:{$user->id}",
                    'cta_kind' => 'open',
                    'cta_payload' => ['href' => '/assistant', 'label' => 'Continua conversatia'],
                ]);
            }

            return;
        }

        $this->notifications->publishToUser($user->id, 'assistant_check_in_due', [
            'title' => 'Check-in cu Assistant',
            'body' => 'Este un moment bun pentru un nou check-in, in intervalul tau preferat.',
            'category' => 'assistant',
            'icon' => 'FiMessageSquare',
            'icon_color' => 'sky',
            'trigger_type' => 'assistant_check_in',
            'trigger_id' => (string) $user->id,
            'dedupe_key' => "assistant_check_in_due:{$user->id}",
            'cta_kind' => 'open',
            'cta_payload' => ['href' => '/assistant', 'label' => 'Fa check-in acum'],
        ]);
    }

    protected function isInsidePreferredWindow(string $window): bool
    {
        $hour = (int) now()->format('G');

        return match ($window) {
            'morning' => $hour >= 7 && $hour < 11,
            'afternoon' => $hour >= 11 && $hour < 17,
            'evening' => $hour >= 17 && $hour < 22,
            'weekend' => now()->isWeekend(),
            default => true,
        };
    }

    protected function guidanceStyleLabel(?string $value): string
    {
        return match ($value) {
            'solution-focused' => 'Direct si orientat pe solutii',
            'motivational' => 'Motivant si pragmatic',
            default => 'Calm si empatic',
        };
    }

    protected function checkInLabel(?string $value): string
    {
        return match ($value) {
            'afternoon' => 'Pranz / dupa-amiaza (11-17)',
            'evening' => 'Seara (17-22)',
            'weekend' => 'Mai ales in weekend',
            default => 'Dimineata (7-11)',
        };
    }

    protected function therapyStatusLabel(?string $value): string
    {
        return match ($value) {
            'considering' => 'Ma gandesc sa incep',
            'active' => 'Sunt in terapie activa',
            'completed' => 'Am incheiat recent un proces terapeutic',
            'none' => 'Nu merg la terapie in prezent',
            default => '',
        };
    }

    protected function assistantStorageReady(): bool
    {
        return Schema::hasTable('assistant_threads')
            && Schema::hasTable('assistant_messages')
            && Schema::hasTable('assistant_memories');
    }
}
