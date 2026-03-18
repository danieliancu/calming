<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('validation')) {
            $rows = DB::table('validation')->get();

            foreach ($rows as $row) {
                $existingId = DB::table('psychologist_validation_applications')
                    ->where('psychologist_id', $row->psychologist_id)
                    ->value('id');

                $status = (int) ($row->status ?? 0) === 1 ? 'approved' : 'draft';

                if ($existingId) {
                    DB::table('psychologist_validation_applications')
                        ->where('id', $existingId)
                        ->update([
                            'status' => $status,
                            'submitted_at' => $row->submitted_at ?? null,
                            'reviewed_at' => $status === 'approved' ? ($row->updated_at ?? now()) : null,
                            'updated_at' => $row->updated_at ?? now(),
                        ]);
                } else {
                    DB::table('psychologist_validation_applications')->insert([
                        'psychologist_id' => $row->psychologist_id,
                        'status' => $status,
                        'submitted_at' => $row->submitted_at ?? null,
                        'reviewed_at' => $status === 'approved' ? ($row->updated_at ?? now()) : null,
                        'created_at' => $row->submitted_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]);
                }
            }

            Schema::dropIfExists('validation');
        }

        if (Schema::hasTable('notifications')) {
            Schema::dropIfExists('notifications');
        }

        if (Schema::hasTable('psychologists_specialities') && ! Schema::hasTable('psychologist_specialties')) {
            Schema::rename('psychologists_specialities', 'psychologist_specialties');
        }

    }

    public function down(): void
    {
        if (Schema::hasTable('psychologist_specialties') && ! Schema::hasTable('psychologists_specialities')) {
            Schema::rename('psychologist_specialties', 'psychologists_specialities');
        }

        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('title');
                $table->text('message');
                $table->string('type')->nullable();
                $table->string('icon')->default('bell');
                $table->string('accent')->default('mint');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('validation')) {
            Schema::create('validation', function (Blueprint $table) {
                $table->foreignId('psychologist_id')->primary()->constrained('psychologists')->cascadeOnDelete();
                $table->boolean('status')->default(false);
                $table->dateTime('submitted_at')->useCurrent();
                $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }
    }
};
