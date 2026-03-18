<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('phone')->nullable()->after('email');
            $table->string('city')->nullable()->after('phone');
            $table->string('country')->nullable()->after('city');
            $table->string('password_hash')->nullable()->after('country');
        });

        DB::table('users')
            ->orderBy('id')
            ->each(function ($user) {
                $parts = preg_split('/\s+/', trim((string) $user->name)) ?: [];
                $firstName = $parts[0] ?? $user->email;
                $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : null;

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'first_name' => $user->first_name ?: $firstName,
                        'last_name' => $user->last_name ?: $lastName,
                        'password_hash' => $user->password_hash ?: $user->password,
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'phone', 'city', 'country', 'password_hash']);
        });
    }
};
