<?php

use App\Mail\AppointmentMessageMail;
use App\Models\Appointment;
use App\Models\Psychologist;
use App\Models\User;
use App\Support\AppointmentLifecycleService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

it('redirects appointments page when psychologist slug is missing or invalid', function () {
    $this->get(route('appointments'))
        ->assertRedirect(route('psychologists'));

    $this->get(route('appointments', ['psychologist' => 'missing-slug']))
        ->assertRedirect(route('psychologists'));
});

it('creates a pending appointment request with payment and reminders for an authenticated user', function () {
    Mail::fake();

    $user = User::factory()->create();
    $psychologistId = createApprovedPsychologistForBooking('booking-success');
    $typeId = createAppointmentType($psychologistId);
    createAvailabilityRule($psychologistId, 0, '09:00', '12:00', 60);

    $nextMonday = nextWeekdayDate(1);

    $this
        ->actingAs($user)
        ->post(route('appointments.store'), [
            'psychologist' => 'booking-success',
            'appointment_type_id' => $typeId,
            'date' => $nextMonday->toDateString(),
            'time' => '09:00',
        ])
        ->assertRedirect();

    $appointment = DB::table('appointments')->where('user_id', $user->id)->first();

    expect($appointment)->not->toBeNull();
    expect($appointment->psychologist_id)->toBe($psychologistId);
    expect($appointment->appointment_type_id)->toBe($typeId);
    expect($appointment->status)->toBe(Appointment::STATUS_PENDING);
    expect($appointment->payment_status)->toBe('authorized');
    expect(DB::table('appointment_status_history')->where('appointment_id', $appointment->id)->count())->toBe(1);
    expect(DB::table('appointment_reminder_preferences')->where('appointment_id', $appointment->id)->count())->toBe(2);
    expect(DB::table('payments')->where('appointment_id', $appointment->id)->value('status'))->toBe('authorized');
    expect(DB::table('notifications')->where('user_id', $user->id)->where('category', 'appointment')->count())->toBeGreaterThanOrEqual(1);

    Mail::assertSent(AppointmentMessageMail::class, 2);
});

it('prevents booking on an inactive appointment type', function () {
    $user = User::factory()->create();
    $psychologistId = createApprovedPsychologistForBooking('inactive-type');
    $typeId = createAppointmentType($psychologistId, ['is_active' => false]);
    createAvailabilityRule($psychologistId, 0, '09:00', '12:00', 60);

    $nextMonday = nextWeekdayDate(1);

    $this
        ->actingAs($user)
        ->post(route('appointments.store'), [
            'psychologist' => 'inactive-type',
            'appointment_type_id' => $typeId,
            'date' => $nextMonday->toDateString(),
            'time' => '09:00',
        ])
        ->assertStatus(422);

    expect(DB::table('appointments')->count())->toBe(0);
});

it('removes blocked slots from availability and prevents double booking while pending', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $psychologistId = createApprovedPsychologistForBooking('booking-guard');
    $typeId = createAppointmentType($psychologistId);
    createAvailabilityRule($psychologistId, 0, '09:00', '12:00', 60);

    $nextMonday = nextWeekdayDate(1);
    createAvailabilityException($psychologistId, $nextMonday->toDateString(), false, '10:00', '11:00');

    $availability = $this->getJson(route('appointments.availability', [
        'psychologist' => 'booking-guard',
        'type' => $typeId,
        'month' => $nextMonday->format('Y-m'),
        'date' => $nextMonday->toDateString(),
    ]));

    $availability->assertOk();
    expect(collect($availability->json('slots'))->pluck('label')->all())->toEqual(['09:00', '11:00']);

    $this
        ->actingAs($user)
        ->post(route('appointments.store'), [
            'psychologist' => 'booking-guard',
            'appointment_type_id' => $typeId,
            'date' => $nextMonday->toDateString(),
            'time' => '09:00',
        ])
        ->assertRedirect();

    $this
        ->actingAs($otherUser)
        ->post(route('appointments.store'), [
            'psychologist' => 'booking-guard',
            'appointment_type_id' => $typeId,
            'date' => $nextMonday->toDateString(),
            'time' => '09:00',
        ])
        ->assertStatus(422);

    expect(DB::table('appointments')->count())->toBe(1);
});

it('confirms a pending appointment and captures payment', function () {
    Mail::fake();

    $user = User::factory()->create();
    $psychologistId = createApprovedPsychologistForBooking('confirm-flow');
    $typeId = createAppointmentType($psychologistId, ['price_amount' => 300]);
    $startsAt = now()->addDays(3)->startOfHour();

    $appointment = Appointment::query()->create([
        'user_id' => $user->id,
        'psychologist_id' => $psychologistId,
        'appointment_type_id' => $typeId,
        'type' => 'Sedinta individuala',
        'psychologist_name' => 'Dr. Confirm Flow',
        'scheduled_for' => $startsAt,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addMinutes(50),
        'location_mode' => 'both',
        'status' => Appointment::STATUS_PENDING,
        'requested_at' => now(),
        'expires_at' => now()->addHours(12),
        'payment_status' => 'authorized',
        'payment_reference' => 'payment-test',
        'total_amount' => 300,
        'platform_fee_amount' => 45,
        'psychologist_payout_amount' => 255,
        'currency' => 'RON',
    ]);

    DB::table('payments')->insert([
        'appointment_id' => $appointment->id,
        'provider' => 'platform_placeholder',
        'provider_reference' => 'payment-test',
        'status' => 'authorized',
        'amount' => 300,
        'platform_fee_amount' => 45,
        'psychologist_payout_amount' => 255,
        'currency' => 'RON',
        'authorized_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    app(AppointmentLifecycleService::class)->confirmByPsychologist($appointment, Psychologist::query()->findOrFail($psychologistId));

    expect($appointment->fresh()->status)->toBe(Appointment::STATUS_CONFIRMED);
    expect($appointment->fresh()->payment_status)->toBe('captured');
    expect(DB::table('payments')->where('appointment_id', $appointment->id)->value('status'))->toBe('captured');
    expect(DB::table('appointment_status_history')->where('appointment_id', $appointment->id)->count())->toBe(1);

    Mail::assertSent(AppointmentMessageMail::class);
});

it('allows cancelling a future confirmed appointment but rejects cancellation after start time', function () {
    $user = User::factory()->create();
    $psychologistId = createApprovedPsychologistForBooking('cancel-flow');
    $typeId = createAppointmentType($psychologistId);

    $futureStart = now()->addDay()->startOfHour();
    $futureAppointmentId = DB::table('appointments')->insertGetId([
        'user_id' => $user->id,
        'psychologist_id' => $psychologistId,
        'appointment_type_id' => $typeId,
        'type' => 'Sedinta individuala',
        'psychologist_name' => 'Dr. Cancel Flow',
        'scheduled_for' => $futureStart,
        'starts_at' => $futureStart,
        'ends_at' => $futureStart->copy()->addMinutes(50),
        'location_mode' => 'both',
        'status' => Appointment::STATUS_CONFIRMED,
        'requested_at' => now()->subHours(4),
        'confirmed_at' => now()->subHours(3),
        'payment_status' => 'captured',
        'payment_reference' => 'future-payment',
        'total_amount' => 220,
        'platform_fee_amount' => 33,
        'psychologist_payout_amount' => 187,
        'currency' => 'RON',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('payments')->insert([
        'appointment_id' => $futureAppointmentId,
        'provider' => 'platform_placeholder',
        'provider_reference' => 'future-payment',
        'status' => 'captured',
        'amount' => 220,
        'platform_fee_amount' => 33,
        'psychologist_payout_amount' => 187,
        'currency' => 'RON',
        'authorized_at' => now()->subHours(4),
        'captured_at' => now()->subHours(3),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this
        ->actingAs($user)
        ->post(route('appointments.cancel', $futureAppointmentId))
        ->assertRedirect();

    expect(DB::table('appointments')->where('id', $futureAppointmentId)->value('status'))->toBe(Appointment::STATUS_CANCELLED_BY_USER);

    $pastStart = now()->subHour()->startOfMinute();
    $pastAppointmentId = DB::table('appointments')->insertGetId([
        'user_id' => $user->id,
        'psychologist_id' => $psychologistId,
        'appointment_type_id' => $typeId,
        'type' => 'Sedinta individuala',
        'psychologist_name' => 'Dr. Cancel Flow',
        'scheduled_for' => $pastStart,
        'starts_at' => $pastStart,
        'ends_at' => $pastStart->copy()->addMinutes(50),
        'location_mode' => 'both',
        'status' => Appointment::STATUS_CONFIRMED,
        'requested_at' => now()->subDay(),
        'confirmed_at' => now()->subDay(),
        'payment_status' => 'captured',
        'payment_reference' => 'past-payment',
        'total_amount' => 220,
        'platform_fee_amount' => 33,
        'psychologist_payout_amount' => 187,
        'currency' => 'RON',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this
        ->actingAs($user)
        ->post(route('appointments.cancel', $pastAppointmentId))
        ->assertStatus(422);

    expect(DB::table('appointments')->where('id', $pastAppointmentId)->value('status'))->toBe(Appointment::STATUS_CONFIRMED);
});

it('preserves redirect target through login and registration views', function () {
    $redirectTo = '/appointments?psychologist=test-slug&type=12&date=2030-01-08&time=10%3A00';

    $this->get(route('login', ['redirectTo' => $redirectTo]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Auth/Login')->where('redirectTo', $redirectTo));

    $this->get(route('register', ['redirectTo' => $redirectTo]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Auth/Register')->where('redirectTo', $redirectTo));
});

function createApprovedPsychologistForBooking(string $slug): int
{
    $psychologistId = DB::table('psychologists')->insertGetId([
        'title' => 'Dr.',
        'name' => 'Booking',
        'surname' => str_replace('-', ' ', ucfirst($slug)),
        'slug' => $slug,
        'supports_online' => true,
        'phone' => '0700000000',
        'email' => "{$slug}@example.local",
        'password_hash' => bcrypt('Password123!'),
        'email_verified_at' => now(),
        'created_at' => now(),
    ]);

    DB::table('psychologists_address')->insert([
        'psychologist_id' => $psychologistId,
        'city' => 'Bucuresti',
        'county' => 'Bucuresti',
    ]);

    DB::table('psychologist_validation_applications')->insert([
        'psychologist_id' => $psychologistId,
        'status' => 'approved',
        'submitted_at' => now()->subDay(),
        'reviewed_at' => now(),
        'created_at' => now()->subDay(),
        'updated_at' => now(),
    ]);

    return $psychologistId;
}

function createAppointmentType(int $psychologistId, array $overrides = []): int
{
    return DB::table('psychologist_appointment_types')->insertGetId(array_merge([
        'psychologist_id' => $psychologistId,
        'label' => 'Sedinta individuala',
        'duration_minutes' => 50,
        'price_amount' => 220,
        'currency' => 'RON',
        'is_paid_online' => true,
        'location_mode' => 'both',
        'is_active' => true,
        'sort_order' => 0,
        'created_at' => now(),
        'updated_at' => now(),
    ], $overrides));
}

function createAvailabilityRule(int $psychologistId, int $weekday, string $startTime, string $endTime, int $intervalMinutes): void
{
    DB::table('psychologist_availability_rules')->insert([
        'psychologist_id' => $psychologistId,
        'weekday' => $weekday,
        'start_time' => $startTime,
        'end_time' => $endTime,
        'interval_minutes' => $intervalMinutes,
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function createAvailabilityException(int $psychologistId, string $date, bool $isAvailable, ?string $startTime = null, ?string $endTime = null): void
{
    DB::table('psychologist_availability_exceptions')->insert([
        'psychologist_id' => $psychologistId,
        'date' => $date,
        'is_available' => $isAvailable,
        'start_time' => $startTime,
        'end_time' => $endTime,
        'interval_minutes' => null,
        'note' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function nextWeekdayDate(int $isoDayOfWeek)
{
    $date = now()->startOfDay();

    while ((int) $date->dayOfWeekIso !== $isoDayOfWeek || $date->lessThanOrEqualTo(now())) {
        $date = $date->copy()->addDay();
    }

    return $date;
}
