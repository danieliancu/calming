<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->enum('audience', ['general', 'authenticated'])->default('general');
            $table->string('title', 200);
            $table->text('message');
            $table->string('icon', 40)->nullable();
            $table->string('accent', 40)->nullable();
            $table->dateTime('published_at')->useCurrent();
            $table->integer('sort_order')->default(0);
            $table->unique(['audience', 'title'], 'notification_templates_audience_title');
        });

        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_id')->constrained('notification_templates')->cascadeOnDelete();
            $table->string('title', 200)->nullable();
            $table->text('message')->nullable();
            $table->string('icon', 40)->nullable();
            $table->string('accent', 40)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question', 255);
            $table->text('answer');
            $table->string('link_href')->nullable();
            $table->string('link_text')->nullable();
            $table->string('link_hint')->nullable();
        });

        Schema::create('article_topics', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
        });

        Schema::create('provider_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('label', 120);
        });

        Schema::create('community_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->unsignedBigInteger('author')->default(10);
            $table->unsignedInteger('members')->default(0);
            $table->string('last_active', 40)->nullable();
            $table->boolean('is_private')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_groups');
        Schema::dropIfExists('provider_types');
        Schema::dropIfExists('article_topics');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('notification_templates');
    }
};
