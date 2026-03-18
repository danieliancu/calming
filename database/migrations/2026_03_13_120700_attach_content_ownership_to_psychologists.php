<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('author');
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->unsignedBigInteger('author')->default(1)->after('hero_image');
            $table->foreign('author', 'fk_articles_psychologist')->references('id')->on('psychologists')->cascadeOnDelete();
        });

        Schema::table('community_groups', function (Blueprint $table) {
            $table->foreign('author', 'fk_community_groups_psychologist')->references('id')->on('psychologists')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        //
    }
};
