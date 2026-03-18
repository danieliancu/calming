<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('psychologists', function (Blueprint $table) {
            if (! Schema::hasColumn('psychologists', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable()->after('email');
            }
        });

        \Illuminate\Support\Facades\DB::table('psychologists')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);

        Schema::create('psychologist_email_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('psychologist_id')->constrained('psychologists')->cascadeOnDelete();
            $table->string('token_hash', 255);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['psychologist_id', 'expires_at'], 'psych_email_verifications_lookup');
        });

        Schema::create('psychologist_mfa_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('psychologist_id')->constrained('psychologists')->cascadeOnDelete();
            $table->string('purpose', 40)->default('login');
            $table->string('code_hash', 255);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['psychologist_id', 'purpose', 'expires_at'], 'psych_mfa_challenges_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psychologist_mfa_challenges');
        Schema::dropIfExists('psychologist_email_verifications');

        Schema::table('psychologists', function (Blueprint $table) {
            if (Schema::hasColumn('psychologists', 'email_verified_at')) {
                $table->dropColumn('email_verified_at');
            }
        });
    }
};
