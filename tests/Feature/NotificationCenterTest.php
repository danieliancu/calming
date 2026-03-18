<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('authenticated user can save an article and enable a reminder', function () {
    $user = User::factory()->create();

    $topicId = DB::table('article_topics')->insertGetId([
        'name' => 'Wellness',
        'slug' => 'wellness',
    ]);
    $psychologistId = DB::table('psychologists')->insertGetId([
        'name' => 'Ana',
        'surname' => 'Test',
        'email' => 'ana-test@example.com',
        'password_hash' => bcrypt('password'),
    ]);

    $articleId = DB::table('articles')->insertGetId([
        'title' => 'Respiratie ghidata',
        'slug' => 'respiratie-ghidata',
        'tag' => 'Wellness',
        'minutes' => 4,
        'hero_image' => '/images/calm-breathing.svg',
        'author' => $psychologistId,
        'body' => 'Continut articol',
        'is_recommended' => 1,
        'topic_id' => $topicId,
    ]);

    $this->actingAs($user)
        ->postJson("/api/articles/{$articleId}/save")
        ->assertOk()
        ->assertJson(['saved' => true]);

    $this->assertDatabaseHas('saved_articles', [
        'user_id' => $user->id,
        'article_id' => $articleId,
        'status' => 'active',
    ]);

    $this->actingAs($user)
        ->postJson("/api/articles/{$articleId}/reminder", ['frequency' => 'monthly'])
        ->assertOk()
        ->assertJson(['reminder' => true, 'frequency' => 'monthly']);

    $this->assertDatabaseHas('notifications', [
        'user_id' => $user->id,
        'recipient_type' => 'user',
        'trigger_type' => 'saved_article',
        'trigger_id' => (string) $articleId,
    ]);

    $this->assertDatabaseHas('notifications', [
        'user_id' => $user->id,
        'recipient_type' => 'user',
        'trigger_type' => 'article_reminder',
        'trigger_id' => (string) $articleId,
    ]);
});

test('authenticated user can mark notifications as read', function () {
    $user = User::factory()->create();

    $notificationId = DB::table('notifications')->insertGetId([
        'recipient_type' => 'user',
        'user_id' => $user->id,
        'category' => 'product',
        'title' => 'Test notification',
        'body' => 'Mesaj de test',
        'status' => 'unread',
        'published_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($user)
        ->postJson('/api/notifications/read', ['notificationId' => $notificationId])
        ->assertOk();

    $this->assertDatabaseHas('notifications', [
        'id' => $notificationId,
        'status' => 'read',
    ]);

    DB::table('notifications')->insert([
        [
            'recipient_type' => 'user',
            'user_id' => $user->id,
            'category' => 'product',
            'title' => 'A doua',
            'body' => 'Mesaj',
            'status' => 'unread',
            'published_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'recipient_type' => 'user',
            'user_id' => $user->id,
            'category' => 'product',
            'title' => 'A treia',
            'body' => 'Mesaj',
            'status' => 'unread',
            'published_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    $this->actingAs($user)
        ->postJson('/api/notifications/read-all')
        ->assertOk();

    expect(DB::table('notifications')->where('user_id', $user->id)->where('status', 'unread')->count())->toBe(0);
});

test('authenticated user can move a notification back from citite', function () {
    $user = User::factory()->create();

    $notificationId = DB::table('notifications')->insertGetId([
        'recipient_type' => 'user',
        'user_id' => $user->id,
        'category' => 'product',
        'title' => 'Notificare citita',
        'body' => 'Mesaj de test',
        'status' => 'read',
        'read_at' => now(),
        'published_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($user)
        ->postJson("/api/notifications/{$notificationId}/action", ['action' => 'unread'])
        ->assertOk();

    $this->assertDatabaseHas('notifications', [
        'id' => $notificationId,
        'status' => 'unread',
        'read_at' => null,
    ]);
});
