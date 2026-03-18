<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_groups', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('community_groups', 'last_active')) {
                $columns[] = 'last_active';
            }

            if (Schema::hasColumn('community_groups', 'facilitator')) {
                $columns[] = 'facilitator';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }

    public function down(): void
    {
        Schema::table('community_groups', function (Blueprint $table) {
            if (! Schema::hasColumn('community_groups', 'last_active')) {
                $table->string('last_active', 40)->nullable()->after('members');
            }

            if (! Schema::hasColumn('community_groups', 'facilitator')) {
                $table->string('facilitator', 180)->nullable()->after('schedule');
            }
        });
    }
};
