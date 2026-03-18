<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_groups', function (Blueprint $table) {
            $table->string('slug', 160)->nullable()->after('name');
            $table->text('description')->nullable()->after('slug');
            $table->string('schedule', 200)->nullable()->after('description');
            $table->string('facilitator', 180)->nullable()->after('schedule');
            $table->text('safety_note')->nullable()->after('facilitator');
        });

        Schema::create('community_group_focus_areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('community_groups')->cascadeOnDelete();
            $table->string('label', 120);
            $table->unsignedInteger('sort_order')->default(0);
        });

        Schema::create('community_dialogues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('community_groups')->cascadeOnDelete();
            $table->string('stamp', 120);
            $table->unsignedInteger('sort_order')->default(0);
        });

        Schema::create('community_dialogue_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dialogue_id')->constrained('community_dialogues')->cascadeOnDelete();
            $table->string('sender', 160);
            $table->string('role', 40)->default('participant');
            $table->string('reply_to', 160)->nullable();
            $table->string('time', 10)->nullable();
            $table->text('text');
            $table->unsignedInteger('sort_order')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_dialogue_messages');
        Schema::dropIfExists('community_dialogues');
        Schema::dropIfExists('community_group_focus_areas');

        Schema::table('community_groups', function (Blueprint $table) {
            $table->dropColumn(['slug', 'description', 'schedule', 'facilitator', 'safety_note']);
        });
    }
};
