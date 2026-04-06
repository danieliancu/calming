<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('psychologist_imports')) {
            return;
        }

        if (! Schema::hasColumn('psychologist_imports', 'name')) {
            Schema::table('psychologist_imports', function (Blueprint $table) {
                $table->string('name', 160)->nullable()->after('rupa_code');
            });
        }

        if (Schema::hasColumn('psychologist_imports', 'first_name') || Schema::hasColumn('psychologist_imports', 'last_name')) {
            DB::statement("
                UPDATE psychologist_imports
                SET name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
                WHERE name IS NULL OR name = ''
            ");
        }

        try {
            Schema::table('psychologist_imports', function (Blueprint $table) {
                $table->dropIndex('psychologist_imports_listing_idx');
            });
        } catch (\Throwable $exception) {
        }

        if (Schema::hasColumn('psychologist_imports', 'first_name') || Schema::hasColumn('psychologist_imports', 'last_name')) {
            Schema::table('psychologist_imports', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('psychologist_imports', 'first_name')) {
                    $columns[] = 'first_name';
                }
                if (Schema::hasColumn('psychologist_imports', 'last_name')) {
                    $columns[] = 'last_name';
                }
                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }

        Schema::table('psychologist_imports', function (Blueprint $table) {
            $table->string('name', 160)->nullable(false)->change();
            $table->index(['is_registered', 'name'], 'psychologist_imports_listing_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('psychologist_imports')) {
            return;
        }

        if (! Schema::hasColumn('psychologist_imports', 'first_name')) {
            Schema::table('psychologist_imports', function (Blueprint $table) {
                $table->string('first_name', 80)->nullable()->after('rupa_code');
            });
        }

        if (! Schema::hasColumn('psychologist_imports', 'last_name')) {
            Schema::table('psychologist_imports', function (Blueprint $table) {
                $table->string('last_name', 80)->nullable()->after('first_name');
            });
        }

        DB::statement("
            UPDATE psychologist_imports
            SET
                first_name = TRIM(SUBSTRING_INDEX(name, ' ', 1)),
                last_name = NULLIF(TRIM(SUBSTRING(name, LENGTH(SUBSTRING_INDEX(name, ' ', 1)) + 1)), '')
            WHERE name IS NOT NULL AND name <> ''
        ");

        try {
            Schema::table('psychologist_imports', function (Blueprint $table) {
                $table->dropIndex('psychologist_imports_listing_idx');
            });
        } catch (\Throwable $exception) {
        }

        if (Schema::hasColumn('psychologist_imports', 'name')) {
            Schema::table('psychologist_imports', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }

        Schema::table('psychologist_imports', function (Blueprint $table) {
            $table->index(['is_registered', 'last_name', 'first_name'], 'psychologist_imports_listing_idx');
        });
    }
};
