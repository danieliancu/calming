<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('validation', function (Blueprint $table) {
            $table->foreignId('psychologist_id')->primary()->constrained('psychologists')->cascadeOnDelete();
            $table->boolean('status')->default(false);
            $table->dateTime('submitted_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('appointment_types', function (Blueprint $table) {
            $table->id();
            $table->string('label', 120);
        });

        Schema::create('appointment_time_slots', function (Blueprint $table) {
            $table->id();
            $table->string('slot', 10);
        });

        Schema::create('related_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->foreignId('related_article_id')->constrained('articles')->cascadeOnDelete();
            $table->integer('sort_order')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('related_articles');
        Schema::dropIfExists('appointment_time_slots');
        Schema::dropIfExists('appointment_types');
        Schema::dropIfExists('validation');
    }
};
