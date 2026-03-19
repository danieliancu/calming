<?php

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('account route redirects to the canonical profile account tab', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/account')
        ->assertRedirect(route('product.profile', ['tab' => 'account']));
});

test('profile page includes the appointments tab payload', function () {
    $user = User::factory()->create();
    $psychologistId = DB::table('psychologists')->insertGetId([
        'title' => 'Dr.',
        'name' => 'Profil',
        'surname' => 'Specialist',
        'slug' => 'profil-specialist',
        'email' => 'profil-specialist@example.test',
        'password_hash' => bcrypt('Password123!'),
        'email_verified_at' => now(),
        'created_at' => now(),
    ]);

    DB::table('appointments')->insert([
        'user_id' => $user->id,
        'psychologist_id' => $psychologistId,
        'type' => 'Sedinta de test',
        'psychologist_name' => 'Dr. Profil Specialist',
        'scheduled_for' => now()->addDay(),
        'starts_at' => now()->addDay(),
        'ends_at' => now()->addDay()->addHour(),
        'location_mode' => 'online',
        'status' => Appointment::STATUS_PENDING,
        'requested_at' => now(),
        'expires_at' => now()->addHours(12),
        'payment_status' => 'authorized',
        'payment_reference' => 'profile-test',
        'total_amount' => 120,
        'platform_fee_amount' => 18,
        'psychologist_payout_amount' => 102,
        'currency' => 'RON',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/profile')
        ->assertInertia(fn ($page) => $page
            ->component('Profile')
            ->has('upcomingAppointments', 1)
            ->where('upcomingAppointments.0.status', Appointment::STATUS_PENDING)
            ->where('upcomingAppointments.0.psychologist_slug', 'profil-specialist')
        );
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('product.profile', ['tab' => 'account']));

    $user->refresh();

    $this->assertSame('Test User', $user->name);
    $this->assertSame('test@example.com', $user->email);
    $this->assertNull($user->email_verified_at);
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('product.profile', ['tab' => 'account']));

    $this->assertNotNull($user->refresh()->email_verified_at);
});

test('user can cancel an appointment from the profile flow and update reminders', function () {
    $user = User::factory()->create();
    $psychologistId = DB::table('psychologists')->insertGetId([
        'title' => 'Dr.',
        'name' => 'Reminder',
        'surname' => 'Specialist',
        'slug' => 'reminder-specialist',
        'email' => 'reminder-specialist@example.test',
        'password_hash' => bcrypt('Password123!'),
        'email_verified_at' => now(),
        'created_at' => now(),
    ]);

    $appointmentId = DB::table('appointments')->insertGetId([
        'user_id' => $user->id,
        'psychologist_id' => $psychologistId,
        'type' => 'Sedinta confirmata',
        'psychologist_name' => 'Dr. Reminder Specialist',
        'scheduled_for' => now()->addDays(2)->startOfHour(),
        'starts_at' => now()->addDays(2)->startOfHour(),
        'ends_at' => now()->addDays(2)->startOfHour()->addMinutes(50),
        'location_mode' => 'online',
        'status' => Appointment::STATUS_CONFIRMED,
        'requested_at' => now()->subDay(),
        'confirmed_at' => now()->subHours(20),
        'payment_status' => 'captured',
        'payment_reference' => 'profile-reminder',
        'total_amount' => 150,
        'platform_fee_amount' => 22.5,
        'psychologist_payout_amount' => 127.5,
        'currency' => 'RON',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('payments')->insert([
        'appointment_id' => $appointmentId,
        'provider' => 'platform_placeholder',
        'provider_reference' => 'profile-reminder',
        'status' => 'captured',
        'amount' => 150,
        'platform_fee_amount' => 22.5,
        'psychologist_payout_amount' => 127.5,
        'currency' => 'RON',
        'authorized_at' => now()->subDay(),
        'captured_at' => now()->subHours(20),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('appointments.reminder', $appointmentId), [
            'minutes_before' => 120,
        ])
        ->assertRedirect();

    expect(DB::table('appointment_reminder_preferences')
        ->where('appointment_id', $appointmentId)
        ->where('actor_type', 'user')
        ->value('minutes_before'))->toBe(120);

    $this->actingAs($user)
        ->post(route('appointments.cancel', $appointmentId))
        ->assertRedirect();

    expect(DB::table('appointments')->where('id', $appointmentId)->value('status'))
        ->toBe(Appointment::STATUS_CANCELLED_BY_USER);
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    $this->assertNull($user->fresh());
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});
