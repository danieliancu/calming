<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $items = array_merge(
            config('calm.notifications.today'),
            config('calm.notifications.earlier'),
        );

        foreach ($items as $item) {
            DB::table('notification_templates')->updateOrInsert(
                ['key' => str($item['title'])->lower()->slug('_')->value()],
                [
                    'audience' => 'general',
                    'actor_type' => 'both',
                    'category' => match ($item['icon'] ?? 'bell') {
                        'calendar', 'clock' => 'reminder',
                        'message' => 'assistant',
                        'users' => 'community',
                        'book' => 'article',
                        'heart' => 'journal',
                        default => 'product',
                    },
                    'title' => $item['title'],
                    'message' => $item['message'],
                    'default_title' => $item['title'],
                    'default_body' => $item['message'],
                    'icon' => $this->mapIcon($item['icon'] ?? 'bell'),
                    'icon_color' => $item['accent'] ?? 'mint',
                    'accent' => $item['accent'] ?? 'mint',
                    'published_at' => now(),
                ],
            );
        }
    }

    protected function mapIcon(string $icon): string
    {
        return match ($icon) {
            'calendar' => 'FiCalendar',
            'message' => 'FiMessageCircle',
            'users' => 'FiUsers',
            'book' => 'FiBookOpen',
            'clock' => 'FiClock',
            'heart' => 'FiHeart',
            default => 'FiBell',
        };
    }
}
