<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_groups', function (Blueprint $table) {
            $table->unsignedBigInteger('fallback_superadmin_id')->nullable()->after('author');
        });

        Schema::table('community_groups', function (Blueprint $table) {
            $table->foreign('fallback_superadmin_id', 'fk_community_groups_fallback_superadmin')
                ->references('id')
                ->on('superadmins')
                ->nullOnDelete();
        });

        Schema::table('community_groups', function (Blueprint $table) {
            $table->dropForeign('fk_community_groups_psychologist');
            $table->unsignedBigInteger('author')->nullable()->default(null)->change();
            $table->foreign('author', 'fk_community_groups_psychologist')
                ->references('id')
                ->on('psychologists')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('community_groups', function (Blueprint $table) {
            $table->dropForeign('fk_community_groups_fallback_superadmin');
            $table->dropForeign('fk_community_groups_psychologist');
            $table->dropColumn('fallback_superadmin_id');
            $table->unsignedBigInteger('author')->default(10)->change();
            $table->foreign('author', 'fk_community_groups_psychologist')
                ->references('id')
                ->on('psychologists')
                ->cascadeOnDelete();
        });
    }
};
