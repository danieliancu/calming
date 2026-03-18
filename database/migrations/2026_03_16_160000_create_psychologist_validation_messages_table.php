<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('psychologist_validation_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('psychologist_validation_applications')->cascadeOnDelete();
            $table->foreignId('superadmin_id')->nullable()->constrained('superadmins')->nullOnDelete();
            $table->text('message');
            $table->dateTime('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psychologist_validation_messages');
    }
};
