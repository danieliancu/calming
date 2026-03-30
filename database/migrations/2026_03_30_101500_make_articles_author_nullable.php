<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE articles DROP FOREIGN KEY fk_articles_psychologist');
        DB::statement('ALTER TABLE articles MODIFY author BIGINT UNSIGNED NULL DEFAULT NULL');
        DB::statement('ALTER TABLE articles ADD CONSTRAINT fk_articles_psychologist FOREIGN KEY (author) REFERENCES psychologists(id) ON DELETE CASCADE');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE articles DROP FOREIGN KEY fk_articles_psychologist');
        DB::statement('UPDATE articles SET author = 1 WHERE author IS NULL');
        DB::statement('ALTER TABLE articles MODIFY author BIGINT UNSIGNED NOT NULL DEFAULT 1');
        DB::statement('ALTER TABLE articles ADD CONSTRAINT fk_articles_psychologist FOREIGN KEY (author) REFERENCES psychologists(id) ON DELETE CASCADE');
    }
};
