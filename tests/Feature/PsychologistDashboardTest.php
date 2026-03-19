<?php

use App\Models\Psychologist;
use Illuminate\Support\Facades\DB;

it('shows community groups with approved and pending review statuses in the psychologist dashboard', function () {
    $psychologistId = DB::table('psychologists')->insertGetId([
        'title' => 'Dr.',
        'name' => 'Dashboard',
        'surname' => 'Specialist',
        'slug' => 'dashboard-specialist',
        'email' => 'dashboard-specialist@example.test',
        'password_hash' => bcrypt('Password123!'),
        'email_verified_at' => now(),
        'created_at' => now(),
    ]);

    DB::table('psychologist_validation_applications')->insert([
        'psychologist_id' => $psychologistId,
        'status' => 'approved',
        'submitted_at' => now()->subDay(),
        'reviewed_at' => now()->subHours(2),
        'created_at' => now()->subDay(),
        'updated_at' => now()->subHours(2),
    ]);

    $approvedGroupId = DB::table('community_groups')->insertGetId([
        'slug' => 'grup-dashboard-aprobat',
        'name' => 'Grup dashboard aprobat',
        'description' => 'Descriere',
        'schedule' => 'Luni 18:00',
        'meeting_link' => 'https://example.test/a',
        'safety_note' => 'Nota',
        'members' => '12',
        'is_private' => false,
        'author' => $psychologistId,
    ]);
    $pendingGroupId = DB::table('community_groups')->insertGetId([
        'slug' => 'grup-dashboard-pending',
        'name' => 'Grup dashboard pending',
        'description' => 'Descriere',
        'schedule' => 'Marti 18:00',
        'meeting_link' => 'https://example.test/b',
        'safety_note' => 'Nota',
        'members' => '8',
        'is_private' => true,
        'author' => $psychologistId,
    ]);

    DB::table('community_groups_validation')->insert([
        ['group_id' => $approvedGroupId, 'is_valid' => true, 'validated_at' => now(), 'created_at' => now(), 'updated_at' => now()],
        ['group_id' => $pendingGroupId, 'is_valid' => false, 'validated_at' => null, 'created_at' => now(), 'updated_at' => now()],
    ]);

    $psychologist = Psychologist::query()->findOrFail($psychologistId);

    $this->actingAs($psychologist, 'psychologist')
        ->withSession(['psychologist_mfa_confirmed_at' => now()->toIso8601String()])
        ->get(route('psychologists.dashboard', ['section' => 'community']))
        ->assertInertia(fn ($page) => $page
            ->component('Psychologists/Dashboard')
            ->has('initialGroups', 2)
            ->where('initialGroups.0.validation_status', 'pending')
            ->where('initialGroups.1.validation_status', 'approved')
        );
});
