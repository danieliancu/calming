<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('tag')->nullable();
            $table->unsignedSmallInteger('minutes')->default(5);
            $table->string('image')->nullable();
            $table->string('author')->nullable();
            $table->string('author_role')->nullable();
            $table->text('summary')->nullable();
            $table->json('body')->nullable();
            $table->json('steps')->nullable();
            $table->text('alert')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
