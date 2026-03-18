<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_templates', function (Blueprint $table) {
            if (! Schema::hasColumn('notification_templates', 'key')) {
                $table->string('key', 120)->nullable()->after('id');
            }
            if (! Schema::hasColumn('notification_templates', 'actor_type')) {
                $table->string('actor_type', 20)->default('both')->after('audience');
            }
            if (! Schema::hasColumn('notification_templates', 'category')) {
                $table->string('category', 40)->default('product')->after('actor_type');
            }
            if (! Schema::hasColumn('notification_templates', 'default_title')) {
                $table->string('default_title', 200)->nullable()->after('category');
            }
            if (! Schema::hasColumn('notification_templates', 'default_body')) {
                $table->text('default_body')->nullable()->after('default_title');
            }
            if (! Schema::hasColumn('notification_templates', 'icon_color')) {
                $table->string('icon_color', 40)->nullable()->after('icon');
            }
            if (! Schema::hasColumn('notification_templates', 'priority')) {
                $table->unsignedTinyInteger('priority')->default(3)->after('icon_color');
            }
            if (! Schema::hasColumn('notification_templates', 'cta_kind')) {
                $table->string('cta_kind', 40)->nullable()->after('priority');
            }
            if (! Schema::hasColumn('notification_templates', 'cta_label')) {
                $table->string('cta_label', 120)->nullable()->after('cta_kind');
            }
            if (! Schema::hasColumn('notification_templates', 'deep_link')) {
                $table->string('deep_link', 255)->nullable()->after('cta_label');
            }
            if (! Schema::hasColumn('notification_templates', 'is_repeatable')) {
                $table->boolean('is_repeatable')->default(false)->after('deep_link');
            }
            if (! Schema::hasColumn('notification_templates', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('is_repeatable');
            }
        });

        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->string('recipient_type', 20);
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('guest_token', 120)->nullable();
                $table->foreignId('template_id')->nullable()->constrained('notification_templates')->nullOnDelete();
                $table->string('category', 40)->default('product');
                $table->string('title', 200);
                $table->text('body');
                $table->string('icon', 40)->nullable();
                $table->string('icon_color', 40)->nullable();
                $table->unsignedTinyInteger('priority')->default(3);
                $table->string('status', 20)->default('unread');
                $table->string('segment', 20)->nullable();
                $table->string('trigger_type', 80)->nullable();
                $table->string('trigger_id', 80)->nullable();
                $table->string('cta_kind', 40)->nullable();
                $table->json('cta_payload')->nullable();
                $table->timestamp('published_at')->useCurrent();
                $table->timestamp('read_at')->nullable();
                $table->timestamp('consumed_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->string('dedupe_key', 180)->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();
            });
        } else {
            Schema::table('notifications', function (Blueprint $table) {
                if (! Schema::hasColumn('notifications', 'recipient_type')) {
                    $table->string('recipient_type', 20)->default('user')->after('id');
                }
                if (! Schema::hasColumn('notifications', 'guest_token')) {
                    $table->string('guest_token', 120)->nullable()->after('user_id');
                }
                if (! Schema::hasColumn('notifications', 'template_id')) {
                    $table->foreignId('template_id')->nullable()->after('guest_token')->constrained('notification_templates')->nullOnDelete();
                }
                if (! Schema::hasColumn('notifications', 'category')) {
                    $table->string('category', 40)->default('product')->after('template_id');
                }
                if (! Schema::hasColumn('notifications', 'body')) {
                    $table->text('body')->nullable()->after('title');
                }
                if (! Schema::hasColumn('notifications', 'icon_color')) {
                    $table->string('icon_color', 40)->nullable()->after('icon');
                }
                if (! Schema::hasColumn('notifications', 'priority')) {
                    $table->unsignedTinyInteger('priority')->default(3)->after('icon_color');
                }
                if (! Schema::hasColumn('notifications', 'status')) {
                    $table->string('status', 20)->default('unread')->after('priority');
                }
                if (! Schema::hasColumn('notifications', 'segment')) {
                    $table->string('segment', 20)->nullable()->after('status');
                }
                if (! Schema::hasColumn('notifications', 'trigger_type')) {
                    $table->string('trigger_type', 80)->nullable()->after('segment');
                }
                if (! Schema::hasColumn('notifications', 'trigger_id')) {
                    $table->string('trigger_id', 80)->nullable()->after('trigger_type');
                }
                if (! Schema::hasColumn('notifications', 'cta_kind')) {
                    $table->string('cta_kind', 40)->nullable()->after('trigger_id');
                }
                if (! Schema::hasColumn('notifications', 'cta_payload')) {
                    $table->json('cta_payload')->nullable()->after('cta_kind');
                }
                if (! Schema::hasColumn('notifications', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('cta_payload');
                }
                if (! Schema::hasColumn('notifications', 'consumed_at')) {
                    $table->timestamp('consumed_at')->nullable()->after('read_at');
                }
                if (! Schema::hasColumn('notifications', 'expires_at')) {
                    $table->timestamp('expires_at')->nullable()->after('consumed_at');
                }
                if (! Schema::hasColumn('notifications', 'dedupe_key')) {
                    $table->string('dedupe_key', 180)->nullable()->after('expires_at');
                }
                if (! Schema::hasColumn('notifications', 'meta')) {
                    $table->json('meta')->nullable()->after('dedupe_key');
                }
            });
        }

        if (Schema::hasColumn('notifications', 'message')) {
            DB::table('notifications')->whereNull('body')->update([
                'body' => DB::raw('message'),
            ]);
        }
        if (Schema::hasColumn('notifications', 'accent')) {
            DB::table('notifications')->whereNull('icon_color')->update([
                'icon_color' => DB::raw('accent'),
            ]);
        }
        if (Schema::hasColumn('notifications', 'type')) {
            DB::table('notifications')->whereNull('category')->update([
                'category' => DB::raw("COALESCE(type, 'product')"),
            ]);
        } else {
            DB::table('notifications')->whereNull('category')->update([
                'category' => 'product',
            ]);
        }
        DB::table('notifications')->whereNull('published_at')->update([
            'published_at' => DB::raw('created_at'),
        ]);
        DB::table('notifications')->whereNull('status')->update([
            'status' => DB::raw("CASE WHEN read_at IS NULL THEN 'unread' ELSE 'read' END"),
        ]);

        try {
            Schema::table('notifications', function (Blueprint $table) {
                $table->index(['recipient_type', 'published_at'], 'notifications_recipient_published_idx');
                $table->index(['user_id', 'status'], 'notifications_user_status_idx');
                $table->index('dedupe_key', 'notifications_dedupe_idx');
            });
        } catch (\Throwable $exception) {
            // Indexes may already exist in environments where the migration was applied manually.
        }

        if (! Schema::hasTable('notification_preferences')) {
            Schema::create('notification_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
                $table->boolean('allow_reminders')->default(true);
                $table->boolean('allow_community')->default(true);
                $table->boolean('allow_articles')->default(true);
                $table->boolean('allow_appointments')->default(true);
                $table->boolean('allow_assistant')->default(true);
                $table->string('digest_frequency', 40)->default('balanced');
                $table->json('muted_categories')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('saved_articles')) {
            Schema::create('saved_articles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
                $table->timestamp('saved_at')->useCurrent();
                $table->string('reminder_frequency', 40)->nullable();
                $table->timestamp('next_remind_at')->nullable();
                $table->timestamp('last_notified_at')->nullable();
                $table->string('status', 20)->default('active');
                $table->timestamps();

                $table->unique(['user_id', 'article_id'], 'saved_articles_user_article_unique');
            });
        }

        Schema::table('milestone_templates', function (Blueprint $table) {
            if (! Schema::hasColumn('milestone_templates', 'icon')) {
                $table->string('icon', 40)->nullable()->after('description');
            }
            if (! Schema::hasColumn('milestone_templates', 'icon_color')) {
                $table->string('icon_color', 40)->nullable()->after('icon');
            }
            if (! Schema::hasColumn('milestone_templates', 'rule_key')) {
                $table->string('rule_key', 120)->nullable()->after('category');
            }
            if (! Schema::hasColumn('milestone_templates', 'is_guest_visible')) {
                $table->boolean('is_guest_visible')->default(false)->after('rule_key');
            }
        });

        Schema::table('user_milestones', function (Blueprint $table) {
            if (! Schema::hasColumn('user_milestones', 'source_type')) {
                $table->string('source_type', 80)->nullable()->after('template_id');
            }
            if (! Schema::hasColumn('user_milestones', 'source_id')) {
                $table->string('source_id', 80)->nullable()->after('source_type');
            }
            if (! Schema::hasColumn('user_milestones', 'meta')) {
                $table->json('meta')->nullable()->after('source_id');
            }
            if (! Schema::hasColumn('user_milestones', 'awarded_by_rule')) {
                $table->string('awarded_by_rule', 120)->nullable()->after('meta');
            }
        });

        DB::table('notification_templates')
            ->whereNull('default_title')
            ->update([
                'default_title' => DB::raw('title'),
                'default_body' => DB::raw('message'),
            ]);

        DB::table('notification_templates')
            ->whereNull('key')
            ->orderBy('id')
            ->get(['id', 'audience', 'title', 'accent'])
            ->each(function (object $template): void {
                $key = str($template->title)->lower()->slug('_')->value();
                $actorType = $template->audience === 'general' ? 'both' : 'user';
                $category = match (true) {
                    str_contains($key, 'articol') => 'article',
                    str_contains($key, 'comunit') || str_contains($key, 'grup') => 'community',
                    str_contains($key, 'program') => 'appointment',
                    str_contains($key, 'jurnal'), str_contains($key, 'serie') => 'journal',
                    str_contains($key, 'profil') => 'profile',
                    str_contains($key, 'asistent') => 'assistant',
                    default => 'product',
                };

                DB::table('notification_templates')
                    ->where('id', $template->id)
                    ->update([
                        'key' => $key ?: 'template_'.$template->id,
                        'actor_type' => $actorType,
                        'category' => $category,
                        'icon_color' => $template->accent ?: 'peach',
                    ]);
            });

        if (Schema::hasTable('user_notifications')) {
            DB::table('user_notifications as un')
                ->leftJoin('notification_templates as nt', 'nt.id', '=', 'un.template_id')
                ->selectRaw("un.id, un.user_id, un.template_id, COALESCE(un.title, nt.default_title, nt.title) as title, COALESCE(un.message, nt.default_body, nt.message) as body, COALESCE(un.icon, nt.icon) as icon, COALESCE(un.accent, nt.icon_color, nt.accent) as icon_color, COALESCE(nt.category, 'product') as category, COALESCE(un.created_at, nt.published_at, CURRENT_TIMESTAMP) as published_at")
                ->orderBy('un.id')
                ->get()
                ->each(function (object $row): void {
                    $exists = DB::table('notifications')
                        ->where('recipient_type', 'user')
                        ->where('user_id', $row->user_id)
                        ->where('template_id', $row->template_id)
                        ->where('title', $row->title)
                        ->where('published_at', $row->published_at)
                        ->exists();

                    if ($exists) {
                        return;
                    }

                    DB::table('notifications')->insert([
                        'recipient_type' => 'user',
                        'user_id' => $row->user_id,
                        'template_id' => $row->template_id,
                        'category' => $row->category ?: 'product',
                        'title' => $row->title,
                        'body' => $row->body,
                        'icon' => $row->icon,
                        'icon_color' => $row->icon_color,
                        'priority' => 3,
                        'status' => 'unread',
                        'published_at' => $row->published_at,
                        'created_at' => $row->published_at,
                        'updated_at' => $row->published_at,
                    ]);
                });
        }
    }

    public function down(): void
    {
        Schema::table('user_milestones', function (Blueprint $table) {
            foreach (['source_type', 'source_id', 'meta', 'awarded_by_rule'] as $column) {
                if (Schema::hasColumn('user_milestones', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('milestone_templates', function (Blueprint $table) {
            foreach (['icon', 'icon_color', 'rule_key', 'is_guest_visible'] as $column) {
                if (Schema::hasColumn('milestone_templates', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('saved_articles');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notifications');

        Schema::table('notification_templates', function (Blueprint $table) {
            foreach (['key', 'actor_type', 'category', 'default_title', 'default_body', 'icon_color', 'priority', 'cta_kind', 'cta_label', 'deep_link', 'is_repeatable', 'is_active'] as $column) {
                if (Schema::hasColumn('notification_templates', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
