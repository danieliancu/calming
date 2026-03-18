<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mood_options', function (Blueprint $table) {
            $table->id();
            $table->string('label')->unique();
            $table->string('emoji', 16);
        });

        Schema::create('journal_symptom_tags', function (Blueprint $table) {
            $table->id();
            $table->string('label')->unique();
        });

        Schema::create('journal_context_tags', function (Blueprint $table) {
            $table->id();
            $table->string('label')->unique();
        });

        Schema::create('mood_symptom_links', function (Blueprint $table) {
            $table->foreignId('mood_id')->constrained('mood_options')->cascadeOnDelete();
            $table->foreignId('symptom_id')->constrained('journal_symptom_tags')->cascadeOnDelete();
            $table->primary(['mood_id', 'symptom_id']);
        });

        Schema::create('journal_quick_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mood_id')->constrained('mood_options')->cascadeOnDelete();
            $table->string('notes', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_quick_entries');
        Schema::dropIfExists('mood_symptom_links');
        Schema::dropIfExists('journal_context_tags');
        Schema::dropIfExists('journal_symptom_tags');
        Schema::dropIfExists('mood_options');
    }
};
