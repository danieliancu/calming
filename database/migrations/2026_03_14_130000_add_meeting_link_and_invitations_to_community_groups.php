<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_groups', function (Blueprint $table) {
            $table->string('meeting_link', 255)->nullable()->after('schedule');
        });

        Schema::create('community_group_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('community_groups')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('email', 190);
            $table->timestamp('invited_at')->useCurrent();
            $table->unique(['group_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_group_invitations');

        Schema::table('community_groups', function (Blueprint $table) {
            $table->dropColumn('meeting_link');
        });
    }
};
