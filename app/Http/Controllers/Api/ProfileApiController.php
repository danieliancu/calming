<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AssistantService;
use App\Support\MilestoneService;
use App\Support\NotificationService;
use App\Support\UserProfileBootstrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProfileApiController extends Controller
{
    public function __construct(
        protected UserProfileBootstrapper $bootstrapper,
        protected NotificationService $notifications,
        protected MilestoneService $milestones,
        protected AssistantService $assistant,
    ) {
    }

    public function show(Request $request): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        $userId = $request->user()->id;
        $this->bootstrapper->ensureForUser($request->user());
        $profileRow = DB::table('user_profiles')->where('user_id', $userId)->first();
        $detailsRow = DB::table('user_profile_details')->where('user_id', $userId)->first();

        return response()->json([
            'profile' => $this->normalizeProfileRow($profileRow),
            'details' => $this->normalizeDetailsRow($detailsRow),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        $validated = $request->validate([
            'communityAlias' => ['required', 'string', 'max:60'],
            'ageRange' => ['nullable', 'string', 'max:32'],
            'focusTopics' => ['array'],
            'focusTopics.*' => ['string', 'max:150'],
            'primaryGoal' => ['nullable', 'string', 'max:600'],
            'stressTriggers' => ['nullable', 'string', 'max:600'],
            'copingStrategies' => ['nullable', 'string', 'max:600'],
            'guidanceStyle' => ['nullable', 'string', 'max:40'],
            'checkInPreference' => ['nullable', 'string', 'max:40'],
            'therapyStatus' => ['nullable', 'string', 'max:40'],
            'notificationFrequency' => ['nullable', 'string', 'max:40'],
            'assistantOptIn' => ['nullable', 'boolean'],
        ]);

        $userId = $request->user()->id;
        $focusTopics = collect($validated['focusTopics'] ?? [])
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->unique(fn ($item) => mb_strtolower($item))
            ->take(10)
            ->values()
            ->all();

        $detailsPayload = [
            'age_range' => $validated['ageRange'] ?: null,
            'focus_topics' => json_encode($focusTopics),
            'primary_goal' => $validated['primaryGoal'] ?: null,
            'stress_triggers' => $validated['stressTriggers'] ?: null,
            'coping_strategies' => $validated['copingStrategies'] ?: null,
            'guidance_style' => $validated['guidanceStyle'] ?: null,
            'check_in_preference' => $validated['checkInPreference'] ?: null,
            'therapy_status' => $validated['therapyStatus'] ?: null,
            'notification_frequency' => $validated['notificationFrequency'] ?: null,
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('user_profile_details', 'assistant_opt_in')) {
            $detailsPayload['assistant_opt_in'] = array_key_exists('assistantOptIn', $validated) ? (bool) $validated['assistantOptIn'] : true;
        }
        if (Schema::hasColumn('user_profile_details', 'assistant_last_profile_refresh_at')) {
            $detailsPayload['assistant_last_profile_refresh_at'] = now();
        }
        if (Schema::hasColumn('user_profile_details', 'preferred_language')) {
            $detailsPayload['preferred_language'] = 'ro';
        }

        DB::table('user_profile_details')->updateOrInsert(
            ['user_id' => $userId],
            $detailsPayload,
        );

        $preferencesPayload = [
            'allow_reminders' => true,
            'allow_community' => true,
            'allow_articles' => true,
            'allow_appointments' => true,
            'allow_assistant' => array_key_exists('assistantOptIn', $validated) ? (bool) $validated['assistantOptIn'] : true,
            'digest_frequency' => $this->assistant->digestFrequency($validated['notificationFrequency'] ?? 'daily'),
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('notification_preferences', 'check_in_window')) {
            $preferencesPayload['check_in_window'] = $validated['checkInPreference'] ?: 'morning';
        }

        DB::table('notification_preferences')->updateOrInsert(
            ['user_id' => $userId],
            $preferencesPayload
        );

        $completion = $this->computeCompletion($validated + ['focusTopics' => $focusTopics]);

        DB::table('user_profiles')->updateOrInsert(
            ['user_id' => $userId],
            [
                'display_name' => $request->user()->name,
                'avatar_initials' => $this->initials($request->user()->name),
                'member_since' => $request->user()->created_at ?? now(),
                'profile_completion' => $completion,
                'community_alias' => $validated['communityAlias'],
            ],
        );

        $this->bootstrapper->syncStats($userId);
        $this->milestones->syncForUser($userId);

        if ($completion >= 100) {
            $this->notifications->publishToUser($userId, 'profile_completed', [
                'title' => 'Profil complet',
                'body' => 'Profilul tau este complet si recomandarile pot deveni mai relevante.',
                'category' => 'profile',
                'icon' => 'FiUser',
                'icon_color' => 'sky',
                'trigger_type' => 'profile',
                'trigger_id' => (string) $userId,
                'dedupe_key' => "profile_complete:{$userId}",
                'cta_kind' => 'open',
                'cta_payload' => ['href' => '/profile', 'label' => 'Deschide profilul'],
            ]);
        }

        return $this->show($request);
    }

    protected function normalizeProfileRow(object|null $row): ?array
    {
        if (! $row) {
            return null;
        }

        return [
            'display_name' => $row->display_name,
            'avatar_initials' => $row->avatar_initials,
            'member_since' => optional($row->member_since)->toISOString() ?? $row->member_since,
            'profile_completion' => $row->profile_completion,
            'community_alias' => $row->community_alias,
        ];
    }

    protected function normalizeDetailsRow(object|null $row): ?array
    {
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
            'assistant_opt_in' => (bool) ($row->assistant_opt_in ?? true),
            'assistant_last_profile_refresh_at' => optional($row->assistant_last_profile_refresh_at)->toISOString() ?? ($row->assistant_last_profile_refresh_at ?? null),
            'preferred_language' => $row->preferred_language ?? 'ro',
        ];
    }

    protected function computeCompletion(array $values): int
    {
        $checks = [
            filled($values['communityAlias'] ?? null),
            filled($values['ageRange'] ?? null),
            ! empty($values['focusTopics'] ?? []),
            filled($values['primaryGoal'] ?? null),
            filled($values['stressTriggers'] ?? null),
            filled($values['copingStrategies'] ?? null),
            filled($values['guidanceStyle'] ?? null),
            filled($values['checkInPreference'] ?? null),
            filled($values['therapyStatus'] ?? null),
            filled($values['notificationFrequency'] ?? null),
        ];

        return min(100, (int) round((collect($checks)->filter()->count() / count($checks)) * 100));
    }

    protected function initials(string $name): string
    {
        return collect(preg_split('/\s+/', trim($name)) ?: [])
            ->filter()
            ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
            ->take(2)
            ->implode('');
    }
}
