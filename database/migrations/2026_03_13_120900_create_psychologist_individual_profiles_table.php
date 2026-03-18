<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('psychologist_individual_profiles', function (Blueprint $table) {
            $table->foreignId('psychologist_id')->primary()->constrained('psychologists')->cascadeOnDelete();
            $table->string('profession', 120)->nullable();
            $table->string('cpr_code', 60)->nullable();
            $table->string('professional_grade', 40)->nullable();
            $table->string('license_number', 60)->nullable();
            $table->date('license_issue_date')->nullable();
            $table->date('license_expiry_date')->nullable();
            $table->string('medical_authorization_number', 60)->nullable();
            $table->text('clinical_competencies')->nullable();
            $table->integer('years_experience')->nullable();
            $table->string('practice_languages', 120)->nullable();
            $table->string('office_hours', 120)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psychologist_individual_profiles');
    }
};
