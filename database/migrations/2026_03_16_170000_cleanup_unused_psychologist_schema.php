<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('psychologist_validation_institutions')) {
            Schema::dropIfExists('psychologist_validation_institutions');
        }

        if (Schema::hasTable('psychologist_validation_applications') && Schema::hasColumn('psychologist_validation_applications', 'provider_type_id')) {
            Schema::table('psychologist_validation_applications', function (Blueprint $table) {
                $table->dropConstrainedForeignId('provider_type_id');
            });
        }

        if (Schema::hasTable('provider_types')) {
            Schema::dropIfExists('provider_types');
        }

        if (Schema::hasTable('psychologists') && Schema::hasColumn('psychologists', 'type_id')) {
            Schema::table('psychologists', function (Blueprint $table) {
                $table->dropColumn('type_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('provider_types')) {
            Schema::create('provider_types', function (Blueprint $table) {
                $table->id();
                $table->string('code', 60)->unique();
                $table->string('label', 120);
            });
        }

        if (Schema::hasTable('psychologist_validation_applications') && ! Schema::hasColumn('psychologist_validation_applications', 'provider_type_id')) {
            Schema::table('psychologist_validation_applications', function (Blueprint $table) {
                $table->foreignId('provider_type_id')->nullable()->after('psychologist_id')->constrained('provider_types')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('psychologist_validation_institutions')) {
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
        }

        if (Schema::hasTable('psychologists') && ! Schema::hasColumn('psychologists', 'type_id')) {
            Schema::table('psychologists', function (Blueprint $table) {
                $table->unsignedInteger('type_id')->nullable()->first();
            });
        }
    }
};
