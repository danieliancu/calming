<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class MilestoneService
{
    public function __construct(protected NotificationService $notifications)
    {
    }

    public function syncForUser(int $userId): void
    {
        $journalEntries = (int) DB::table('journal_entries')->where('user_id', $userId)->count();
        $quickEntries = (int) DB::table('journal_quick_entries')->where('user_id', $userId)->count();
        $appointmentCount = (int) DB::table('appointments')->where('user_id', $userId)->count();
        $savedArticleCount = (int) DB::table('saved_articles')->where('user_id', $userId)->where('status', 'active')->count();
        $profileCompletion = (int) (DB::table('user_profiles')->where('user_id', $userId)->value('profile_completion') ?? 0);
        $streakDays = $this->computeStreakDays($userId);

        if ($journalEntries > 0) {
            $this->award($userId, 'first_journal_entry', 'journal_entry', (string) $journalEntries);
        }
        if ($quickEntries > 0) {
            $this->award($userId, 'first_quick_check_in', 'journal_quick_entry', (string) $quickEntries);
        }
        if ($streakDays >= 3) {
            $this->award($userId, 'streak_3', 'journal_streak', '3');
        }
        if ($streakDays >= 7) {
            $this->award($userId, 'streak_7', 'journal_streak', '7');
        }
        if ($streakDays >= 14) {
            $this->award($userId, 'streak_14', 'journal_streak', '14');
        }
        if ($streakDays >= 30) {
            $this->award($userId, 'streak_30', 'journal_streak', '30');
        }
        if ($appointmentCount > 0) {
            $this->award($userId, 'first_appointment', 'appointment', (string) $appointmentCount);
        }
        if ($savedArticleCount > 0) {
            $this->award($userId, 'first_saved_article', 'saved_article', (string) $savedArticleCount);
        }
        if ($profileCompletion >= 100) {
            $this->award($userId, 'profile_complete', 'profile', (string) $profileCompletion);
        }
    }

    public function award(int $userId, string $ruleKey, ?string $sourceType = null, ?string $sourceId = null, array $meta = []): void
    {
        $template = DB::table('milestone_templates')->where('rule_key', $ruleKey)->orWhere('template_key', $ruleKey)->first();

        if (! $template) {
            return;
        }

        $existing = DB::table('user_milestones')
            ->where('user_id', $userId)
            ->where('template_id', $template->id)
            ->exists();

        if ($existing) {
            return;
        }

        DB::table('user_milestones')->insert([
            'user_id' => $userId,
            'template_id' => $template->id,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'meta' => $meta !== [] ? json_encode($meta) : null,
            'awarded_by_rule' => $ruleKey,
            'achieved_at' => now(),
        ]);

        $this->notifications->publishToUser($userId, 'milestone_unlocked', [
            'title' => 'Reper nou deblocat',
            'body' => $template->title.': '.($template->description ?: 'Ai atins un nou reper in Calming.'),
            'category' => 'milestone',
            'icon' => $template->icon ?: 'FiAward',
            'icon_color' => $template->icon_color ?: 'rose',
            'trigger_type' => 'milestone',
            'trigger_id' => (string) $template->id,
            'dedupe_key' => "milestone:{$userId}:{$template->id}",
            'cta_kind' => 'open',
            'cta_payload' => ['href' => '/profile', 'label' => 'Vezi reperele'],
        ]);
    }

    protected function computeStreakDays(int $userId): int
    {
        $dates = DB::table(DB::raw("(
            SELECT DATE(created_at) as day_value FROM journal_entries WHERE user_id = {$userId}
            UNION
            SELECT DATE(created_at) as day_value FROM journal_quick_entries WHERE user_id = {$userId}
        ) as activity_days"))
            ->orderByDesc('day_value')
            ->pluck('day_value')
            ->all();

        if ($dates === []) {
            return 0;
        }

        $streak = 0;
        $cursor = now()->startOfDay();
        $pool = collect($dates)->map(fn ($value) => (string) $value)->flip();

        while ($pool->has($cursor->toDateString())) {
            $streak++;
            $cursor = $cursor->copy()->subDay();
        }

        return $streak;
    }
}
