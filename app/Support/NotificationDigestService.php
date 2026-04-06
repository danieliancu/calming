<?php

namespace App\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class NotificationDigestService
{
    public function defaultGuestNotifications(): array
    {
        $approvedCount = DB::table('psychologist_validation_applications')
            ->where('status', 'approved')
            ->count();

        $uniqueImportedPsychologists = $this->uniqueImportedPsychologists();
        $activePsychologistsCount = $approvedCount + $uniqueImportedPsychologists->count();
        $topCity = $this->topPsychologistCity($uniqueImportedPsychologists);

        $topCategory = DB::table('article_topics as at')
            ->leftJoin('articles as a', 'a.topic_id', '=', 'at.id')
            ->groupBy('at.id', 'at.name')
            ->orderByRaw('COUNT(a.id) DESC')
            ->first(['at.name']);

        return [
            [
                'id' => 'guest-stats-psychologists',
                'title' => 'Specialisti activi disponibili',
                'body' => 'In aplicatie sunt '.$activePsychologistsCount.' specialisti activi disponibili.',
                'category' => 'stats',
                'icon' => 'FiTrendingUp',
                'icon_color' => 'indigo',
                'accent' => 'indigo',
                'published_at' => now()->subHours(4)->toAtomString(),
                'created_at' => now()->subHours(4)->toAtomString(),
                'relative_time' => 'Acum 4 ore',
                'is_new' => true,
                'is_read' => false,
                'cta' => ['kind' => 'open', 'label' => 'Vezi specialistii', 'href' => '/psychologists'],
            ],
            [
                'id' => 'guest-stats-city',
                'title' => 'Oras bine reprezentat',
                'body' => $topCity ? 'Cei mai multi psihologi listati sunt in '.$topCity.'.' : 'Descopera orasele in care poti gasi sprijin rapid.',
                'category' => 'stats',
                'icon' => 'FiMapPin',
                'icon_color' => 'sky',
                'accent' => 'sky',
                'published_at' => now()->subDay()->toAtomString(),
                'created_at' => now()->subDay()->toAtomString(),
                'relative_time' => 'Ieri',
                'is_new' => false,
                'is_read' => false,
                'cta' => ['kind' => 'open', 'label' => 'Exploreaza specialistii', 'href' => '/psychologists'],
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

    protected function uniqueImportedPsychologists(): Collection
    {
        if (! Schema::hasTable('psychologist_imports')) {
            return collect();
        }

        return DB::table('psychologist_imports')
            ->where('is_registered', false)
            ->get(['name', 'city'])
            ->filter(fn ($row) => filled($row->name))
            ->groupBy(fn ($row) => trim((string) $row->name))
            ->map(fn ($rows) => $rows->first())
            ->values();
    }

    protected function topPsychologistCity(Collection $uniqueImportedPsychologists): ?string
    {
        $approvedCities = DB::table('psychologists as p')
            ->join('psychologist_validation_applications as pva', 'pva.psychologist_id', '=', 'p.id')
            ->leftJoin('psychologists_address as pa', 'pa.psychologist_id', '=', 'p.id')
            ->where('pva.status', 'approved')
            ->whereNotNull('pa.city')
            ->pluck('pa.city');

        return $approvedCities
            ->concat($uniqueImportedPsychologists->pluck('city'))
            ->filter(fn ($city) => filled($city))
            ->map(fn ($city) => trim((string) $city))
            ->countBy()
            ->sortDesc()
            ->keys()
            ->first();
    }
}
