<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('psychologists', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('type_id')->nullable();
            $table->string('title', 60)->nullable();
            $table->string('name', 80);
            $table->string('surname', 80);
            $table->boolean('supports_online')->default(false);
            $table->string('phone', 40)->nullable();
            $table->string('email')->unique();
            $table->string('password_hash', 255)->nullable();
            $table->dateTime('created_at')->useCurrent();
        });

        Schema::create('psychologists_specialities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('psychologist_id')->constrained('psychologists')->cascadeOnDelete();
            $table->string('label', 150);
        });

        Schema::create('psychologists_address', function (Blueprint $table) {
            $table->foreignId('psychologist_id')->primary()->constrained('psychologists')->cascadeOnDelete();
            $table->string('address', 200)->nullable();
            $table->string('city', 120)->nullable();
            $table->string('county', 120)->nullable();
        });

        Schema::create('validation_entity_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('label', 120);
        });

        Schema::create('professional_roles', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('label', 120);
            $table->boolean('requires_cpr')->default(false);
            $table->boolean('requires_med_authorization')->default(false);
            $table->dateTime('created_at')->useCurrent();
        });

        Schema::create('professional_grades', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('label', 60);
            $table->unsignedTinyInteger('sort_order');
            $table->dateTime('created_at')->useCurrent();
        });

        Schema::create('psychologist_validation_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('psychologist_id')->unique()->constrained('psychologists')->cascadeOnDelete();
            $table->foreignId('provider_type_id')->nullable()->constrained('provider_types')->nullOnDelete();
            $table->foreignId('entity_type_id')->nullable()->constrained('validation_entity_types')->nullOnDelete();
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');
            $table->dateTime('submitted_at')->nullable();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('reviewer_notes')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('psychologist_validation_locations', function (Blueprint $table) {
            $table->foreignId('application_id')->primary()->constrained('psychologist_validation_applications')->cascadeOnDelete();
            $table->boolean('supports_online')->default(false);
            $table->enum('city_mode', ['bucuresti', 'other'])->default('bucuresti');
            $table->string('city', 120)->nullable();
            $table->string('county', 120)->nullable();
            $table->string('sector', 30)->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('psychologist_validation_institutions', function (Blueprint $table) {
            $table->foreignId('application_id')->primary()->constrained('psychologist_validation_applications')->cascadeOnDelete();
            $table->string('legal_name', 200)->nullable();
            $table->string('cui_cif', 40)->nullable();
            $table->string('registration_number', 60)->nullable();
            $table->string('email', 120)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('website', 200)->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('psychologist_validation_specialists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('psychologist_validation_applications')->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->string('title', 60)->nullable();
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->foreignId('professional_role_id')->constrained(table: 'professional_roles', indexName: 'fk_pv_specialists_role');
            $table->string('professional_email', 120);
            $table->string('professional_phone', 40)->nullable();
            $table->string('cpr_code', 60)->nullable();
            $table->string('license_number', 60)->nullable();
            $table->date('license_issue_date')->nullable();
            $table->date('license_expiry_date')->nullable();
            $table->foreignId('professional_grade_id')->nullable()->constrained(table: 'professional_grades', indexName: 'fk_pv_specialists_grade');
            $table->string('medical_authorization_number', 60)->nullable();
            $table->text('clinical_competencies')->nullable();
            $table->text('description')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('psychologist_validation_specialist_specializations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('specialist_id')->constrained(table: 'psychologist_validation_specialists', indexName: 'fk_pv_specs_specialist')->cascadeOnDelete();
            $table->string('label', 150);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psychologist_validation_specialist_specializations');
        Schema::dropIfExists('psychologist_validation_specialists');
        Schema::dropIfExists('psychologist_validation_institutions');
        Schema::dropIfExists('psychologist_validation_locations');
        Schema::dropIfExists('psychologist_validation_applications');
        Schema::dropIfExists('professional_grades');
        Schema::dropIfExists('professional_roles');
        Schema::dropIfExists('validation_entity_types');
        Schema::dropIfExists('psychologists_address');
        Schema::dropIfExists('psychologists_specialities');
        Schema::dropIfExists('psychologists');
    }
};
