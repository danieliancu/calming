<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_groups_validation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->unique()->constrained('community_groups')->cascadeOnDelete();
            $table->boolean('is_valid')->default(false);
            $table->timestamp('validated_at')->nullable();
            $table->text('reviewer_notes')->nullable();
            $table->timestamps();
        });

        $now = now();

        foreach (DB::table('community_groups')->select('id')->get() as $group) {
            DB::table('community_groups_validation')->insert([
                'group_id' => $group->id,
                'is_valid' => true,
                'validated_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_groups_validation');
    }
};
