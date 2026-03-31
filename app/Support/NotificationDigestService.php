<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class NotificationDigestService
{
    public function defaultGuestNotifications(): array
    {
        $cities = DB::table('psychologists_address')
            ->select('city', DB::raw('COUNT(*) as total'))
            ->whereNotNull('city')
            ->groupBy('city')
            ->orderByDesc('total')
            ->limit(1)
            ->first();

        $topCategory = DB::table('article_topics as at')
            ->leftJoin('articles as a', 'a.topic_id', '=', 'at.id')
            ->groupBy('at.id', 'at.name')
            ->orderByRaw('COUNT(a.id) DESC')
            ->first(['at.name']);

        return [
            [
                'id' => 'guest-stats-psychologists',
                'title' => 'Specialiști validați disponibili',
                'body' => 'In aplicatie sunt '.DB::table('psychologist_validation_applications')->where('status', 'approved')->count().' psihologi validati.',
                'category' => 'stats',
                'icon' => 'FiTrendingUp',
                'icon_color' => 'indigo',
                'accent' => 'indigo',
                'published_at' => now()->subHours(4)->toAtomString(),
                'created_at' => now()->subHours(4)->toAtomString(),
                'relative_time' => 'Acum 4 ore',
                'is_new' => true,
                'is_read' => false,
                'cta' => ['kind' => 'open', 'label' => 'Vezi specialiștii', 'href' => '/psychologists'],
            ],
            [
                'id' => 'guest-stats-city',
                'title' => 'Oras bine reprezentat',
                'body' => $cities ? 'Cei mai multi psihologi listati sunt in '.$cities->city.'.' : 'Descopera orasele in care poti gasi sprijin rapid.',
                'category' => 'stats',
                'icon' => 'FiMapPin',
                'icon_color' => 'sky',
                'accent' => 'sky',
                'published_at' => now()->subDay()->toAtomString(),
                'created_at' => now()->subDay()->toAtomString(),
                'relative_time' => 'Ieri',
                'is_new' => false,
                'is_read' => false,
                'cta' => ['kind' => 'open', 'label' => 'Explorează specialiștii', 'href' => '/psychologists'],
            ],
            [
                'id' => 'guest-stats-category',
                'title' => 'Categorie activa in biblioteca',
                'body' => $topCategory ? 'Categoria cu cele mai multe resurse este '.$topCategory->name.'.' : 'Biblioteca are articole noi pentru ritm, somn si reglare emotionala.',
                'category' => 'article',
                'icon' => 'FiBookOpen',
                'icon_color' => 'lilac',
                'accent' => 'lilac',
                'published_at' => now()->subDays(2)->toAtomString(),
                'created_at' => now()->subDays(2)->toAtomString(),
                'relative_time' => 'Acum 2 zile',
                'is_new' => false,
                'is_read' => false,
                'cta' => ['kind' => 'open', 'label' => 'Mergi la articole', 'href' => '/learn'],
            ],
        ];
    }
}
