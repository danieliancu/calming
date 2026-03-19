<?php

use Illuminate\Support\Facades\DB;

it('approves and rejects psychologist validation applications from the superadmin dashboard', function () {
    $superadminId = createSuperadminSessionUser();
    $psychologistId = createPsychologistRecord('validation-review');
    $applicationId = DB::table('psychologist_validation_applications')->insertGetId([
        'psychologist_id' => $psychologistId,
        'status' => 'submitted',
        'submitted_at' => now()->subHour(),
        'created_at' => now()->subHour(),
        'updated_at' => now()->subHour(),
    ]);

    $this->withSession(['superadmin_id' => $superadminId])
        ->post(route('superadmin.validation.approve', $applicationId))
        ->assertRedirect();

    expect(DB::table('psychologist_validation_applications')->where('id', $applicationId)->value('status'))
        ->toBe('approved');

    $this->withSession(['superadmin_id' => $superadminId])
        ->post(route('superadmin.validation.reject', $applicationId), [
            'reviewer_notes' => 'Dosar incomplet.',
        ])
        ->assertRedirect();

    expect(DB::table('psychologist_validation_applications')->where('id', $applicationId)->value('status'))
        ->toBe('rejected');
    expect(DB::table('psychologist_validation_applications')->where('id', $applicationId)->value('reviewer_notes'))
        ->toBe('Dosar incomplet.');
});

it('approves and rejects articles and support groups from the superadmin dashboard', function () {
    $superadminId = createSuperadminSessionUser();
    $psychologistId = createPsychologistRecord('content-review');
    $topicId = DB::table('article_topics')->insertGetId([
        'name' => 'Mindfulness',
        'slug' => 'mindfulness',
    ]);
    $articleId = DB::table('articles')->insertGetId([
        'title' => 'Articol pending',
        'slug' => 'articol-pending',
        'tag' => 'focus',
        'minutes' => 4,
        'hero_image' => 'https://example.test/image.jpg',
        'author' => $psychologistId,
        'body' => json_encode('<p>Continut de test</p>'),
        'is_recommended' => true,
        'topic_id' => $topicId,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $groupId = createCommunityGroupRecord($psychologistId, 'grup-pending-admin');

    $this->withSession(['superadmin_id' => $superadminId])
        ->post(route('superadmin.articles.approve', $articleId))
        ->assertRedirect();

    expect((bool) DB::table('articles_validation')->where('article_id', $articleId)->value('is_valid'))
        ->toBeTrue();

    $this->withSession(['superadmin_id' => $superadminId])
        ->post(route('superadmin.articles.reject', $articleId))
        ->assertRedirect();

    expect((bool) DB::table('articles_validation')->where('article_id', $articleId)->value('is_valid'))
        ->toBeFalse();

    $this->withSession(['superadmin_id' => $superadminId])
        ->post(route('superadmin.community-groups.approve', $groupId))
        ->assertRedirect();

    expect((bool) DB::table('community_groups_validation')->where('group_id', $groupId)->value('is_valid'))
        ->toBeTrue();

    $this->withSession(['superadmin_id' => $superadminId])
        ->post(route('superadmin.community-groups.reject', $groupId), [
            'reviewer_notes' => 'Mai are nevoie de clarificari.',
        ])
        ->assertRedirect();

    expect((bool) DB::table('community_groups_validation')->where('group_id', $groupId)->value('is_valid'))
        ->toBeFalse();
    expect(DB::table('community_groups_validation')->where('group_id', $groupId)->value('reviewer_notes'))
        ->toBe('Mai are nevoie de clarificari.');
});

it('manages article categories and notification templates from the superadmin dashboard', function () {
    $superadminId = createSuperadminSessionUser();

    $this->withSession(['superadmin_id' => $superadminId])
        ->post(route('superadmin.article-categories.store'), [
            'name' => 'Terapie',
            'slug' => 'terapie',
        ])
        ->assertRedirect();

    $categoryId = DB::table('article_topics')->where('slug', 'terapie')->value('id');
    expect($categoryId)->not->toBeNull();

    $this->withSession(['superadmin_id' => $superadminId])
        ->put(route('superadmin.article-categories.update', $categoryId), [
            'name' => 'Terapie integrata',
            'slug' => 'terapie-integrata',
        ])
        ->assertRedirect();

    expect(DB::table('article_topics')->where('id', $categoryId)->value('slug'))
        ->toBe('terapie-integrata');

    $templateId = DB::table('notification_templates')->insertGetId([
        'key' => 'template-test',
        'audience' => 'general',
        'actor_type' => 'both',
        'category' => 'product',
        'title' => 'Titlu initial',
        'message' => 'Mesaj initial',
        'default_title' => 'Titlu initial',
        'default_body' => 'Mesaj initial',
        'icon' => 'FiBell',
        'icon_color' => 'rose',
        'accent' => 'rose',
        'priority' => 3,
        'cta_kind' => 'open',
        'cta_label' => 'Vezi',
        'deep_link' => '/notifications',
        'is_repeatable' => false,
        'is_active' => true,
        'published_at' => now(),
        'sort_order' => 0,
    ]);

    $this->withSession(['superadmin_id' => $superadminId])
        ->put(route('superadmin.notification-templates.update', $templateId), [
            'default_title' => 'Titlu nou',
            'default_body' => 'Mesaj nou',
            'audience' => 'authenticated',
            'actor_type' => 'user',
            'category' => 'appointment',
            'icon' => 'FiCalendar',
            'icon_color' => 'mint',
            'priority' => 5,
            'cta_kind' => 'open',
            'cta_label' => 'Deschide',
            'deep_link' => '/appointments',
            'is_repeatable' => true,
            'is_active' => true,
        ])
        ->assertRedirect();

    expect(DB::table('notification_templates')->where('id', $templateId)->value('default_title'))
        ->toBe('Titlu nou');
    expect(DB::table('notification_templates')->where('id', $templateId)->value('category'))
        ->toBe('appointment');

    $this->withSession(['superadmin_id' => $superadminId])
        ->delete(route('superadmin.article-categories.destroy', $categoryId))
        ->assertRedirect();

    expect(DB::table('article_topics')->where('id', $categoryId)->exists())->toBeFalse();
});

function createSuperadminSessionUser(): int
{
    return DB::table('superadmins')->insertGetId([
        'username' => 'superadmin-test',
        'password_hash' => bcrypt('Password123!'),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createPsychologistRecord(string $slug): int
{
    return DB::table('psychologists')->insertGetId([
        'title' => 'Dr.',
        'name' => 'Test',
        'surname' => ucfirst(str_replace('-', ' ', $slug)),
        'slug' => $slug,
        'email' => "{$slug}@example.test",
        'password_hash' => bcrypt('Password123!'),
        'email_verified_at' => now(),
        'created_at' => now(),
    ]);
}

function createCommunityGroupRecord(int $psychologistId, string $slug): int
{
    return DB::table('community_groups')->insertGetId([
        'slug' => $slug,
        'name' => ucfirst(str_replace('-', ' ', $slug)),
        'description' => 'Descriere grup',
        'schedule' => 'Marti 19:00',
        'meeting_link' => 'https://example.test/group',
        'safety_note' => 'Note',
        'members' => '10',
        'is_private' => false,
        'author' => $psychologistId,
    ]);
}
