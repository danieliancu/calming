<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('articles')
            ->select('id', 'hero_image')
            ->orderBy('id')
            ->get()
            ->each(function ($article) {
                $value = (string) ($article->hero_image ?? '');

                if ($value === '') {
                    return;
                }

                $normalized = preg_replace('#^https?://[^/]+(/storage/.+)$#i', '$1', $value);

                if (is_string($normalized) && $normalized !== $value) {
                    DB::table('articles')
                        ->where('id', $article->id)
                        ->update(['hero_image' => $normalized]);
                }
            });
    }

    public function down(): void
    {
    }
};
