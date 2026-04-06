<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('psychologists', function (Blueprint $table) {
            $table->string('attestation_number', 60)->nullable()->after('rupa_code');
            $table->unique('attestation_number', 'psychologists_attestation_number_unique');
        });

        Schema::create('psychologist_imports', function (Blueprint $table) {
            $table->id();
            $table->string('attestation_number', 60)->unique();
            $table->date('license_issue_date')->nullable();
            $table->string('rupa_code', 60)->nullable();
            $table->string('name', 160);
            $table->string('specialty_commission', 160)->nullable();
            $table->string('specialization', 150)->nullable();
            $table->string('professional_grade', 80)->nullable();
            $table->string('practice_regime', 40)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('professional_email', 120)->nullable();
            $table->boolean('is_registered')->default(false);
            $table->foreignId('registered_psychologist_id')->nullable()->constrained('psychologists')->nullOnDelete();
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();

            $table->index(['is_registered', 'name'], 'psychologist_imports_listing_idx');
            $table->index('rupa_code', 'psychologist_imports_rupa_code_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psychologist_imports');

        Schema::table('psychologists', function (Blueprint $table) {
            $table->dropUnique('psychologists_attestation_number_unique');
            $table->dropColumn('attestation_number');
        });
    }
};
