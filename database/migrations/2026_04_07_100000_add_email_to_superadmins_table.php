<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('superadmins', function (Blueprint $table) {
            $table->string('email', 190)->nullable()->after('username');
        });

        $superadmins = DB::table('superadmins')->select('id', 'username', 'email')->get();
        $usedEmails = [];

        foreach ($superadmins as $superadmin) {
            $base = $superadmin->email ?: $superadmin->username.'@calming.test';
            $candidate = strtolower($base);
            $counter = 1;

            while (in_array($candidate, $usedEmails, true) || DB::table('superadmins')->where('email', $candidate)->where('id', '!=', $superadmin->id)->exists()) {
                $candidate = strtolower($superadmin->username)."+{$counter}@calming.test";
                $counter++;
            }

            DB::table('superadmins')
                ->where('id', $superadmin->id)
                ->update([
                    'email' => $candidate,
                    'updated_at' => now(),
                ]);

            $usedEmails[] = $candidate;
        }

        Schema::table('superadmins', function (Blueprint $table) {
            $table->unique('email');
        });
    }

    public function down(): void
    {
        Schema::table('superadmins', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->dropColumn('email');
        });
    }
};
