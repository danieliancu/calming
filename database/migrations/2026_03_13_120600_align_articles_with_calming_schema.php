<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (! Schema::hasColumn('articles', 'hero_image')) {
                $table->string('hero_image')->nullable()->after('minutes');
            }
            if (! Schema::hasColumn('articles', 'is_recommended')) {
                $table->boolean('is_recommended')->default(true)->after('body');
            }
            if (! Schema::hasColumn('articles', 'topic_id')) {
                $table->foreignId('topic_id')->nullable()->after('is_recommended')->constrained('article_topics')->nullOnDelete();
            }
        });

        if (Schema::hasColumn('articles', 'image')) {
            DB::statement('UPDATE articles SET hero_image = COALESCE(hero_image, image)');
            Schema::table('articles', function (Blueprint $table) {
                $table->dropColumn(['image', 'author_role', 'summary', 'steps', 'alert', 'is_published']);
            });
        }

        Schema::create('articles_validation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->boolean('is_valid')->default(true);
            $table->dateTime('validated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles_validation');
    }
};
