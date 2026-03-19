<?php

use App\Models\Psychologist;
use App\Models\User;
use Illuminate\Support\Facades\DB;

it('shows only approved community groups publicly while authors can still see their pending groups', function () {
    $author = createCommunityPsychologist('autor-grup');
    $approvedGroupId = createCommunityGroup($author->id, 'grup-aprobat', false);
    $pendingGroupId = createCommunityGroup($author->id, 'grup-pending', false);

    DB::table('community_groups_validation')->insert([
        'group_id' => $approvedGroupId,
        'is_valid' => true,
        'validated_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('community_groups_validation')->insert([
        'group_id' => $pendingGroupId,
        'is_valid' => false,
        'validated_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->get(route('community'))
        ->assertInertia(fn ($page) => $page
            ->component('Community')
            ->has('groups', 1)
            ->where('groups.0.slug', 'grup-aprobat')
        );

    $this->get(route('community.group', 'grup-pending'))->assertNotFound();

    $this->actingAs($author, 'psychologist')
        ->withSession(['psychologist_mfa_confirmed_at' => now()->toIso8601String()])
        ->get(route('community'))
        ->assertInertia(fn ($page) => $page
            ->component('Community')
            ->has('groups', 2)
        );

    $this->actingAs($author, 'psychologist')
        ->withSession(['psychologist_mfa_confirmed_at' => now()->toIso8601String()])
        ->get(route('community.group', 'grup-pending'))
        ->assertOk();
});

it('enforces public and private access rules for community conversations', function () {
    $author = createCommunityPsychologist('moderator-comunitate');
    $publicGroupId = createCommunityGroup($author->id, 'grup-public', false);
    $privateGroupId = createCommunityGroup($author->id, 'grup-privat', true);

    DB::table('community_groups_validation')->insert([
        ['group_id' => $publicGroupId, 'is_valid' => true, 'validated_at' => now(), 'created_at' => now(), 'updated_at' => now()],
        ['group_id' => $privateGroupId, 'is_valid' => true, 'validated_at' => now(), 'created_at' => now(), 'updated_at' => now()],
    ]);

    $dialoguePublicId = DB::table('community_dialogues')->insertGetId([
        'group_id' => $publicGroupId,
        'stamp' => 'Luni, 1 martie 2026',
        'sort_order' => 1,
    ]);
    DB::table('community_dialogue_messages')->insert([
        'dialogue_id' => $dialoguePublicId,
        'sender' => 'Moderator',
        'role' => 'facilitator',
        'time' => '10:00',
        'text' => 'Salut',
        'sort_order' => 1,
    ]);

    $dialoguePrivateId = DB::table('community_dialogues')->insertGetId([
        'group_id' => $privateGroupId,
        'stamp' => 'Marti, 2 martie 2026',
        'sort_order' => 1,
    ]);
    DB::table('community_dialogue_messages')->insert([
        'dialogue_id' => $dialoguePrivateId,
        'sender' => 'Moderator',
        'role' => 'facilitator',
        'time' => '11:00',
        'text' => 'Salut privat',
        'sort_order' => 1,
    ]);

    $invitedUser = User::factory()->create();
    $otherUser = User::factory()->create();

    DB::table('community_group_invitations')->insert([
        'group_id' => $privateGroupId,
        'user_id' => $invitedUser->id,
        'email' => $invitedUser->email,
        'invited_at' => now(),
    ]);

    $this->actingAs($otherUser)
        ->get(route('community.group.conversations.messages.index', 'grup-public'))
        ->assertOk()
        ->assertJsonCount(1, 'dialogues');

    $this->actingAs($otherUser)
        ->get(route('community.group.conversations.messages.index', 'grup-privat'))
        ->assertForbidden();

    $this->actingAs($invitedUser)
        ->get(route('community.group.conversations.messages.index', 'grup-privat'))
        ->assertOk()
        ->assertJsonCount(1, 'dialogues');

    $this->actingAs($author, 'psychologist')
        ->withSession(['psychologist_mfa_confirmed_at' => now()->toIso8601String()])
        ->get(route('community.group.conversations.messages.index', 'grup-privat'))
        ->assertOk()
        ->assertJsonCount(1, 'dialogues');
});

function createCommunityPsychologist(string $slug): Psychologist
{
    $id = DB::table('psychologists')->insertGetId([
        'title' => 'Dr.',
        'name' => 'Community',
        'surname' => ucfirst(str_replace('-', ' ', $slug)),
        'slug' => $slug,
        'email' => "{$slug}@example.test",
        'password_hash' => bcrypt('Password123!'),
        'email_verified_at' => now(),
        'created_at' => now(),
    ]);

    return Psychologist::query()->findOrFail($id);
}

function createCommunityGroup(int $psychologistId, string $slug, bool $isPrivate): int
{
    return DB::table('community_groups')->insertGetId([
        'slug' => $slug,
        'name' => ucfirst(str_replace('-', ' ', $slug)),
        'description' => 'Descriere grup',
        'schedule' => 'Joi 18:00',
        'meeting_link' => 'https://example.test/community',
        'safety_note' => 'Note',
        'members' => '10',
        'is_private' => $isPrivate,
        'author' => $psychologistId,
    ]);
}
