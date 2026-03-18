<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('profile update accepts custom focus topics and syncs assistant preferences', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', [
            'communityAlias' => 'Danny Boy',
            'ageRange' => '45-54',
            'focusTopics' => [
                'Gestionarea anxietatii',
                'Oboseala decizionala',
                'Oboseala decizionala',
            ],
            'primaryGoal' => 'Sa imi recapet claritatea.',
            'stressTriggers' => 'Suprasolicitarea si lipsa de somn.',
            'copingStrategies' => 'Pauze scurte si mers.',
            'guidanceStyle' => 'calm-empathetic',
            'checkInPreference' => 'morning',
            'therapyStatus' => 'considering',
            'notificationFrequency' => 'daily',
            'assistantOptIn' => true,
        ])
        ->assertOk()
        ->assertJsonPath('details.focus_topics.1', 'Oboseala decizionala')
        ->assertJsonPath('details.assistant_opt_in', true);

    expect(DB::table('notification_preferences')->where('user_id', $user->id)->value('allow_assistant'))->toBe(1);
    expect(DB::table('notification_preferences')->where('user_id', $user->id)->value('check_in_window'))->toBe('morning');
});

test('assistant bootstrap returns active thread and profile for authenticated user', function () {
    $user = User::factory()->create();

    DB::table('user_profile_details')->updateOrInsert(
        ['user_id' => $user->id],
        [
            'focus_topics' => json_encode(['Gestionarea anxietatii']),
            'guidance_style' => 'calm-empathetic',
            'check_in_preference' => 'morning',
            'notification_frequency' => 'daily',
            'assistant_opt_in' => true,
            'preferred_language' => 'ro',
            'updated_at' => now(),
        ]
    );

    $this->actingAs($user)
        ->getJson('/api/assistant/bootstrap')
        ->assertOk()
        ->assertJsonPath('guest_mode', false)
        ->assertJsonStructure([
            'profile',
            'thread' => ['id', 'status', 'message_count'],
            'messages',
            'limits',
            'assistant_preferences',
        ]);
});

test('assistant can answer for authenticated user and persist messages', function () {
    $user = User::factory()->create();

    DB::table('user_profile_details')->updateOrInsert(
        ['user_id' => $user->id],
        [
            'focus_topics' => json_encode(['Somn si recuperare']),
            'guidance_style' => 'calm-empathetic',
            'check_in_preference' => 'morning',
            'notification_frequency' => 'daily',
            'assistant_opt_in' => true,
            'preferred_language' => 'ro',
            'updated_at' => now(),
        ]
    );

    $this->actingAs($user)
        ->postJson('/api/assistant/messages', [
            'content' => 'Ma simt obosit si agitat in ultimele zile.',
        ])
        ->assertOk()
        ->assertJsonPath('message.role', 'assistant');

    expect(DB::table('assistant_threads')->where('user_id', $user->id)->count())->toBe(1);
    expect(DB::table('assistant_messages')->count())->toBe(2);
});

test('assistant can start a new conversation by archiving the active thread', function () {
    $user = User::factory()->create();

    DB::table('user_profile_details')->updateOrInsert(
        ['user_id' => $user->id],
        [
            'focus_topics' => json_encode(['Gestionarea anxietatii']),
            'guidance_style' => 'calm-empathetic',
            'check_in_preference' => 'morning',
            'notification_frequency' => 'daily',
            'assistant_opt_in' => true,
            'preferred_language' => 'ro',
            'updated_at' => now(),
        ]
    );

    $threadId = DB::table('assistant_threads')->insertGetId([
        'user_id' => $user->id,
        'status' => 'active',
        'last_activity_at' => now(),
        'summary_text' => 'summary',
        'profile_snapshot' => json_encode(['focus_topics' => ['Gestionarea anxietatii']]),
        'message_count' => 2,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('assistant_messages')->insert([
        [
            'thread_id' => $threadId,
            'role' => 'user',
            'content' => 'Mesaj vechi',
            'status' => 'completed',
            'safety_state' => 'ok',
            'created_at' => now(),
        ],
        [
            'thread_id' => $threadId,
            'role' => 'assistant',
            'content' => 'Raspuns vechi',
            'status' => 'completed',
            'safety_state' => 'ok',
            'created_at' => now(),
        ],
    ]);

    $response = $this->actingAs($user)
        ->postJson('/api/assistant/new-conversation')
        ->assertOk();

    expect(DB::table('assistant_threads')->where('user_id', $user->id)->where('status', 'archived')->count())->toBe(1);
    expect(DB::table('assistant_threads')->where('user_id', $user->id)->where('status', 'active')->count())->toBe(1);
    expect($response->json('messages'))->toBe([]);
    expect($response->json('thread.message_count'))->toBe(0);
});

test('guest assistant responds and enforces session limit payload', function () {
    config()->set('assistant.max_guest_messages', 2);

    $this->postJson('/api/assistant/guest/respond', [
        'guestProfile' => [
            'guidanceStyle' => 'calm-empathetic',
            'focusTopics' => ['Gestionarea stresului'],
        ],
        'messages' => [
            ['role' => 'user', 'content' => 'Am nevoie de un check-in rapid.'],
        ],
        'sessionMessageCount' => 2,
    ])->assertOk()
        ->assertJsonPath('limit_reached', true);
});

test('guest assistant fallback reply adapts to the latest user message', function () {
    config()->set('assistant.api_key', '');

    $response = $this->postJson('/api/assistant/guest/respond', [
        'guestProfile' => [
            'guidanceStyle' => 'calm-empathetic',
            'focusTopics' => ['Gestionarea stresului'],
        ],
        'messages' => [
            ['role' => 'user', 'content' => 'hello'],
            ['role' => 'assistant', 'content' => 'Salut.'],
            ['role' => 'user', 'content' => 'ce ma apasa cel mai mult este nesimtirea unora'],
        ],
        'sessionMessageCount' => 1,
    ])->assertOk();

    expect(strtolower((string) $response->json('message.content')))->toContain('frustrare');
    expect(strtolower((string) $response->json('message.content')))->not->toContain('setarile acestei conversatii');
    expect(strtolower((string) $response->json('message.content')))->not->toContain('voi raspunde');
});

test('guest assistant fallback uses shorter conversational prompts for vague openings', function () {
    config()->set('assistant.api_key', '');

    $talkResponse = $this->postJson('/api/assistant/guest/respond', [
        'guestProfile' => [
            'guidanceStyle' => 'calm-empathetic',
            'focusTopics' => ['Gestionarea anxietatii'],
        ],
        'messages' => [
            ['role' => 'user', 'content' => 'as vrea sa vorbim'],
        ],
        'sessionMessageCount' => 0,
    ])->assertOk();

    expect(strtolower((string) $talkResponse->json('message.content')))->toContain('sunt aici');
    expect(strtolower((string) $talkResponse->json('message.content')))->not->toContain('multumesc ca ai spus asta direct');

    $copeResponse = $this->postJson('/api/assistant/guest/respond', [
        'guestProfile' => [
            'guidanceStyle' => 'calm-empathetic',
            'focusTopics' => ['Gestionarea anxietatii'],
        ],
        'messages' => [
            ['role' => 'user', 'content' => 'nu stiu cum sa ma descurc'],
        ],
        'sessionMessageCount' => 0,
    ])->assertOk();

    expect(strtolower((string) $copeResponse->json('message.content')))->toContain('coplesit');
    expect(strtolower((string) $copeResponse->json('message.content')))->toContain('problema cea mai urgenta');
});

test('guest assistant does not escalate health anxiety as suicide risk', function () {
    config()->set('assistant.api_key', '');

    $response = $this->postJson('/api/assistant/guest/respond', [
        'guestProfile' => [
            'guidanceStyle' => 'calm-empathetic',
            'focusTopics' => ['Gestionarea anxietatii'],
        ],
        'messages' => [
            ['role' => 'user', 'content' => 'sunt ingrijorat ca o sa fac un atac de inima si o sa mor'],
        ],
        'sessionMessageCount' => 0,
    ])->assertOk();

    expect(strtolower((string) $response->json('message.content')))->toContain('panica');
    expect(strtolower((string) $response->json('message.content')))->not->toContain('suna acum la 112');
});
