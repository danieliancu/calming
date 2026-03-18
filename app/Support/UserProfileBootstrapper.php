<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class UserProfileBootstrapper
{
    public function __construct(protected MilestoneService $milestones)
    {
    }

    public function ensureForUser(User $user): void
    {
        DB::transaction(function () use ($user) {
            $hasAssistantOptIn = Schema::hasColumn('user_profile_details', 'assistant_opt_in');
            $hasPreferredLanguage = Schema::hasColumn('user_profile_details', 'preferred_language');

            DB::table('user_profiles')->updateOrInsert(
                ['user_id' => $user->id],
                [
                    'display_name' => $user->name,
                    'avatar_initials' => $this->initials($user->name),
                    'member_since' => $user->created_at ?? now(),
                    'profile_completion' => DB::table('user_profiles')->where('user_id', $user->id)->value('profile_completion') ?? 20,
                    'community_alias' => DB::table('user_profiles')->where('user_id', $user->id)->value('community_alias') ?: $this->communityAlias($user->name),
                ],
            );

            $detailsPayload = [
                'focus_topics' => DB::table('user_profile_details')->where('user_id', $user->id)->value('focus_topics') ?? json_encode([]),
                'updated_at' => now(),
            ];

            if ($hasAssistantOptIn) {
                $detailsPayload['assistant_opt_in'] = DB::table('user_profile_details')->where('user_id', $user->id)->value('assistant_opt_in') ?? true;
            }

            if ($hasPreferredLanguage) {
                $detailsPayload['preferred_language'] = DB::table('user_profile_details')->where('user_id', $user->id)->value('preferred_language') ?? 'ro';
            }

            DB::table('user_profile_details')->updateOrInsert(
                ['user_id' => $user->id],
                $detailsPayload,
            );

            $this->syncStats($user->id);
        });
    }

    public function syncStats(int $userId): void
    {
        $fullEntries = DB::table('journal_entries')->where('user_id', $userId)->count();
        $quickEntries = DB::table('journal_quick_entries')->where('user_id', $userId)->count();
        $totalEntries = $fullEntries + $quickEntries;

        $goodDays = DB::table(DB::raw("(
            SELECT DATE(je.created_at) AS day_value
            FROM journal_entries je
            JOIN mood_options mo ON mo.id = je.mood_id
            WHERE je.user_id = {$userId} AND mo.label IN ('Minunat', 'Bine')
            UNION
            SELECT DATE(jq.created_at) AS day_value
            FROM journal_quick_entries jq
            JOIN mood_options mo ON mo.id = jq.mood_id
            WHERE jq.user_id = {$userId} AND mo.label IN ('Minunat', 'Bine')
        ) AS good_days"))->count();

        $activeDays = DB::table(DB::raw("(
            SELECT DATE(created_at) AS day_value
            FROM journal_entries
            WHERE user_id = {$userId}
            UNION
            SELECT DATE(created_at) AS day_value
            FROM journal_quick_entries
            WHERE user_id = {$userId}
        ) AS active_days"))->count();

        $stats = [
            [
                'metric_key' => 'journal_entries',
                'label' => 'Intrari in jurnal',
                'value' => (string) $totalEntries,
                'tone' => 'rose',
                'icon' => 'FiActivity',
                'sort_order' => 10,
            ],
            [
                'metric_key' => 'good_days',
                'label' => 'Zile bune',
                'value' => "{$goodDays} zile",
                'tone' => 'teal',
                'icon' => 'FiHeart',
                'sort_order' => 20,
            ],
            [
                'metric_key' => 'stress_level',
                'label' => 'Nivel mediu stres: In curs',
                'value' => $totalEntries > 0 ? 'OK' : '-',
                'tone' => 'amber',
                'icon' => 'FiTrendingUp',
                'sort_order' => 30,
            ],
            [
                'metric_key' => 'active_days',
                'label' => 'Zile active',
                'value' => "{$activeDays} zile",
                'tone' => 'indigo',
                'icon' => 'FiCalendar',
                'sort_order' => 40,
            ],
        ];

        foreach ($stats as $row) {
            DB::table('user_stats')->updateOrInsert(
                ['user_id' => $userId, 'metric_key' => $row['metric_key']],
                $row + ['user_id' => $userId],
            );
        }

        $preferencePayload = [
            'allow_reminders' => true,
            'allow_community' => true,
            'allow_articles' => true,
            'allow_appointments' => true,
            'allow_assistant' => true,
            'digest_frequency' => 'balanced',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('notification_preferences', 'check_in_window')) {
            $preferencePayload['check_in_window'] = 'morning';
        }

        DB::table('notification_preferences')->updateOrInsert(
            ['user_id' => $userId],
            $preferencePayload
        );

        $this->milestones->syncForUser($userId);
    }

    protected function initials(string $name): string
    {
        return collect(preg_split('/\s+/', trim($name)) ?: [])
            ->filter()
            ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
            ->take(2)
            ->implode('');
    }

    protected function communityAlias(string $name): string
    {
        $parts = collect(preg_split('/\s+/', trim($name)) ?: [])->filter()->values();

        if ($parts->count() >= 2) {
            return $parts->get(0).' '.substr((string) $parts->get(1), 0, 1).'.';
        }

        return $parts->get(0, 'Utilizator');
    }
}
