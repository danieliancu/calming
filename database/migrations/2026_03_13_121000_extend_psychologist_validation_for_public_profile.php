<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('psychologists', function (Blueprint $table) {
            $table->string('rupa_code', 10)->nullable()->after('email');
        });

        Schema::table('psychologist_validation_specialists', function (Blueprint $table) {
            $table->enum('practice_regime', ['supervizare', 'autonom'])->nullable()->after('professional_grade_id');
            $table->string('specialty_commission', 160)->nullable()->after('practice_regime');
        });

        Schema::table('psychologist_individual_profiles', function (Blueprint $table) {
            $table->text('public_bio')->nullable()->after('clinical_competencies');
        });

        Schema::create('psychologist_validation_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('psychologist_validation_applications')->cascadeOnDelete();
            $table->string('disk', 40)->default('public');
            $table->string('path', 255);
            $table->string('original_name', 255);
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->dateTime('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psychologist_validation_documents');

        Schema::table('psychologist_individual_profiles', function (Blueprint $table) {
            $table->dropColumn('public_bio');
        });

        Schema::table('psychologist_validation_specialists', function (Blueprint $table) {
            $table->dropColumn(['practice_regime', 'specialty_commission']);
        });

        Schema::table('psychologists', function (Blueprint $table) {
            $table->dropColumn('rupa_code');
        });
    }
};
