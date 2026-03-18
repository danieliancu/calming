<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_profile_details', function (Blueprint $table) {
            if (! Schema::hasColumn('user_profile_details', 'assistant_opt_in')) {
                $table->boolean('assistant_opt_in')->default(true)->after('notification_frequency');
            }
            if (! Schema::hasColumn('user_profile_details', 'assistant_last_profile_refresh_at')) {
                $table->timestamp('assistant_last_profile_refresh_at')->nullable()->after('assistant_opt_in');
            }
            if (! Schema::hasColumn('user_profile_details', 'preferred_language')) {
                $table->string('preferred_language', 10)->default('ro')->after('assistant_last_profile_refresh_at');
            }
        });

        Schema::table('notification_preferences', function (Blueprint $table) {
            if (! Schema::hasColumn('notification_preferences', 'check_in_window')) {
                $table->string('check_in_window', 40)->default('morning')->after('digest_frequency');
            }
        });

        if (! Schema::hasTable('assistant_threads')) {
            Schema::create('assistant_threads', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
                $table->string('status', 20)->default('active');
                $table->timestamp('last_activity_at')->nullable();
                $table->text('summary_text')->nullable();
                $table->json('profile_snapshot')->nullable();
                $table->unsignedInteger('message_count')->default(0);
                $table->timestamps();

                $table->index(['user_id', 'status'], 'assistant_threads_user_status_idx');
            });
        }

        if (! Schema::hasTable('assistant_messages')) {
            Schema::create('assistant_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('thread_id')->constrained('assistant_threads')->cascadeOnDelete();
                $table->string('role', 20);
                $table->longText('content');
                $table->unsignedInteger('input_tokens')->nullable();
                $table->unsignedInteger('output_tokens')->nullable();
                $table->string('model', 80)->nullable();
                $table->string('status', 20)->default('completed');
                $table->string('safety_state', 40)->default('ok');
                $table->timestamp('created_at')->useCurrent();

                $table->index(['thread_id', 'created_at'], 'assistant_messages_thread_created_idx');
            });
        }

        if (! Schema::hasTable('assistant_memories')) {
            Schema::create('assistant_memories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
                $table->text('memory_summary')->nullable();
                $table->json('structured_memory')->nullable();
                $table->foreignId('last_summarized_message_id')->nullable()->constrained('assistant_messages')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_memories');
        Schema::dropIfExists('assistant_messages');
        Schema::dropIfExists('assistant_threads');

        Schema::table('notification_preferences', function (Blueprint $table) {
            if (Schema::hasColumn('notification_preferences', 'check_in_window')) {
                $table->dropColumn('check_in_window');
            }
        });

        Schema::table('user_profile_details', function (Blueprint $table) {
            foreach (['assistant_opt_in', 'assistant_last_profile_refresh_at', 'preferred_language'] as $column) {
                if (Schema::hasColumn('user_profile_details', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
