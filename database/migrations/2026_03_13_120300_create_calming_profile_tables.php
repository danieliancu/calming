<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('display_name', 150);
            $table->string('avatar_initials', 10)->nullable();
            $table->dateTime('member_since')->nullable();
            $table->unsignedTinyInteger('profile_completion')->default(0);
            $table->string('community_alias', 80)->nullable();
        });

        Schema::create('user_profile_details', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('age_range', 32)->nullable();
            $table->text('focus_topics')->nullable();
            $table->text('primary_goal')->nullable();
            $table->text('stress_triggers')->nullable();
            $table->text('coping_strategies')->nullable();
            $table->string('guidance_style', 40)->nullable();
            $table->string('check_in_preference', 40)->nullable();
            $table->string('therapy_status', 40)->nullable();
            $table->string('notification_frequency', 40)->nullable();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('user_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('metric_key', 80);
            $table->string('label', 150);
            $table->string('value', 100);
            $table->string('tone', 40)->nullable();
            $table->string('icon', 40)->nullable();
            $table->integer('sort_order')->default(0);
            $table->unique(['user_id', 'metric_key'], 'user_stats_user_metric');
        });

        Schema::create('milestone_templates', function (Blueprint $table) {
            $table->id();
            $table->string('template_key', 60)->unique();
            $table->string('title', 150);
            $table->string('description', 255)->nullable();
            $table->string('category', 60);
            $table->integer('sort_order')->default(0);
        });

        Schema::create('user_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_id')->nullable()->constrained('milestone_templates')->nullOnDelete();
            $table->timestamp('achieved_at')->useCurrent();
        });

        Schema::create('resource_templates', function (Blueprint $table) {
            $table->id();
            $table->string('template_key', 60)->unique();
            $table->string('label', 150);
            $table->integer('sort_order')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_templates');
        Schema::dropIfExists('user_milestones');
        Schema::dropIfExists('milestone_templates');
        Schema::dropIfExists('user_stats');
        Schema::dropIfExists('user_profile_details');
        Schema::dropIfExists('user_profiles');
    }
};
