<?php

namespace App\Support;

use App\Models\Appointment;
use App\Models\Psychologist;
use App\Models\PsychologistAppointmentType;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PsychologistBookingService
{
    public function approvedPsychologistBySlug(string $slug): ?object
    {
        return DB::table('psychologists as p')
            ->leftJoin('psychologists_address as pa', 'pa.psychologist_id', '=', 'p.id')
            ->leftJoin('psychologist_validation_applications as pva', 'pva.psychologist_id', '=', 'p.id')
            ->where('p.slug', $slug)
            ->where('pva.status', 'approved')
            ->first([
                'p.id',
                'p.slug',
                'p.title',
                'p.name',
                'p.surname',
                'p.supports_online',
                'p.phone',
                'p.email',
                'pa.address',
                'pa.city',
                'pa.county',
            ]);
    }

    public function activeTypesForPsychologist(int $psychologistId): Collection
    {
        return DB::table('psychologist_appointment_types')
            ->where('psychologist_id', $psychologistId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'label', 'duration_minutes', 'price_amount', 'currency', 'is_paid_online', 'location_mode']);
    }

    public function availabilitySnapshot(int $psychologistId, int $typeId, CarbonInterface $month, ?CarbonInterface $date = null): array
    {
        $selectedDate = $date ? Carbon::instance($date->toDateTime())->startOfDay() : null;

        return [
            'availableDates' => $this->availableDatesForMonth($psychologistId, $typeId, $month),
            'slots' => $selectedDate ? $this->slotsForDate($psychologistId, $typeId, $selectedDate) : [],
        ];
    }

    public function availableDatesForMonth(int $psychologistId, int $typeId, CarbonInterface $month): array
    {
        $cursor = Carbon::instance($month->toDateTime())->startOfMonth();
        $end = Carbon::instance($month->toDateTime())->endOfMonth();
        $dates = [];

        while ($cursor->lte($end)) {
            if ($this->slotsForDate($psychologistId, $typeId, $cursor) !== []) {
                $dates[] = $cursor->toDateString();
            }

            $cursor->addDay();
        }

        return $dates;
    }

    public function slotsForDate(int $psychologistId, int $typeId, CarbonInterface $date): array
    {
        $type = DB::table('psychologist_appointment_types')
            ->where('psychologist_id', $psychologistId)
            ->where('id', $typeId)
            ->where('is_active', true)
            ->first(['id', 'duration_minutes']);

        if (! $type) {
            return [];
        }

        $date = Carbon::instance($date->toDateTime())->startOfDay();
        if ($date->isPast() && ! $date->isToday()) {
            return [];
        }

        $duration = (int) $type->duration_minutes;
        $rules = DB::table('psychologist_availability_rules')
            ->where('psychologist_id', $psychologistId)
            ->where('weekday', $this->weekdayIndex($date))
            ->where('is_active', true)
            ->orderBy('start_time')
            ->get();

        $slots = collect();
        foreach ($rules as $rule) {
            $slots = $slots->merge($this->buildSlotsFromWindow(
                $date,
                (string) $rule->start_time,
                (string) $rule->end_time,
                (int) $rule->interval_minutes,
                $duration
            ));
        }

        $exceptions = DB::table('psychologist_availability_exceptions')
            ->where('psychologist_id', $psychologistId)
            ->whereDate('date', $date->toDateString())
            ->orderBy('is_available')
            ->orderBy('start_time')
            ->get();

        $dayBlocked = $exceptions->contains(fn ($exception) => ! $exception->is_available && ! $exception->start_time && ! $exception->end_time);
        if ($dayBlocked) {
            $slots = collect();
        }

        foreach ($exceptions->where('is_available', true) as $exception) {
            if (! $exception->start_time || ! $exception->end_time) {
                continue;
            }

            $slots = $slots->merge($this->buildSlotsFromWindow(
                $date,
                (string) $exception->start_time,
                (string) $exception->end_time,
                (int) ($exception->interval_minutes ?: $duration),
                $duration
            ));
        }

        $slots = $slots
            ->sortBy(fn (array $slot) => $slot['starts_at'])
            ->values();

        foreach ($exceptions->where('is_available', false) as $exception) {
            if (! $exception->start_time && ! $exception->end_time) {
                continue;
            }

            $blockStart = $exception->start_time
                ? $date->copy()->setTimeFromTimeString((string) $exception->start_time)
                : $date->copy()->startOfDay();
            $blockEnd = $exception->end_time
                ? $date->copy()->setTimeFromTimeString((string) $exception->end_time)
                : $date->copy()->endOfDay();

            $slots = $slots->reject(fn (array $slot) => $this->overlaps(
                Carbon::parse($slot['starts_at']),
                Carbon::parse($slot['ends_at']),
                $blockStart,
                $blockEnd
            ))->values();
        }

        $bookedAppointments = Appointment::query()
            ->where('psychologist_id', $psychologistId)
            ->whereDate('starts_at', $date->toDateString())
            ->whereIn('status', Appointment::ACTIVE_BLOCKING_STATUSES)
            ->get(['starts_at', 'ends_at']);

        $slots = $slots->reject(function (array $slot) use ($bookedAppointments) {
            $slotStart = Carbon::parse($slot['starts_at']);
            $slotEnd = Carbon::parse($slot['ends_at']);

            return $bookedAppointments->contains(fn (Appointment $appointment) => $this->overlaps(
                $slotStart,
                $slotEnd,
                $appointment->starts_at,
                $appointment->ends_at
            ));
        })->values();

        $now = now();
        if ($date->isToday()) {
            $slots = $slots->filter(fn (array $slot) => Carbon::parse($slot['starts_at'])->greaterThan($now))->values();
        }

        return $slots
            ->map(fn (array $slot) => [
                ...$slot,
                'label' => Carbon::parse($slot['starts_at'])->format('H:i'),
            ])
            ->all();
    }

    public function createAppointmentRequestForUser(User $user, int $psychologistId, int $typeId, CarbonInterface $startsAt): Appointment
    {
        return DB::transaction(function () use ($user, $psychologistId, $typeId, $startsAt) {
            $psychologist = Psychologist::query()->where('id', $psychologistId)->lockForUpdate()->first(['id', 'title', 'name', 'surname', 'email', 'slug']);
            abort_unless($psychologist, 404, 'Specialistul nu exista.');

            $type = PsychologistAppointmentType::query()
                ->where('psychologist_id', $psychologistId)
                ->where('id', $typeId)
                ->where('is_active', true)
                ->first();

            abort_unless($type, 422, 'Tipul de ședință nu este disponibil.');

            $startsAt = Carbon::instance($startsAt->toDateTime())->seconds(0);
            abort_if($startsAt->lessThanOrEqualTo(now()), 422, 'Nu poti rezerva o programare in trecut.');

            $availableSlots = collect($this->slotsForDate($psychologistId, $typeId, $startsAt));
            $slot = $availableSlots->first(fn (array $item) => Carbon::parse($item['starts_at'])->equalTo($startsAt));
            abort_unless($slot, 422, 'Slotul selectat nu mai este disponibil.');

            $endsAt = Carbon::parse($slot['ends_at']);

            $overlapExists = Appointment::query()
                ->where('psychologist_id', $psychologistId)
                ->whereIn('status', Appointment::ACTIVE_BLOCKING_STATUSES)
                ->where('starts_at', '<', $endsAt)
                ->where('ends_at', '>', $startsAt)
                ->exists();

            abort_if($overlapExists, 422, 'Slotul selectat a fost rezervat intre timp.');

            $totalAmount = (float) $type->price_amount;
            $platformFee = round($totalAmount * 0.15, 2);
            $payoutAmount = round($totalAmount - $platformFee, 2);

            return $user->appointments()->create([
                'psychologist_id' => $psychologistId,
                'appointment_type_id' => $type->id,
                'type' => $type->label,
                'psychologist_name' => trim(collect([$psychologist->title, $psychologist->name, $psychologist->surname])->filter()->implode(' ')),
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'scheduled_for' => $startsAt,
                'location_mode' => $type->location_mode,
                'status' => Appointment::STATUS_PENDING,
                'requested_at' => now(),
                'expires_at' => $this->expirationMoment($startsAt),
                'payment_status' => $type->is_paid_online ? 'authorization_pending' : 'not_required',
                'total_amount' => $totalAmount,
                'platform_fee_amount' => $platformFee,
                'psychologist_payout_amount' => $payoutAmount,
                'currency' => $type->currency,
            ]);
        });
    }

    public function createAppointmentForUser(User $user, int $psychologistId, int $typeId, CarbonInterface $startsAt): Appointment
    {
        return $this->createAppointmentRequestForUser($user, $psychologistId, $typeId, $startsAt);
    }

    protected function buildSlotsFromWindow(CarbonInterface $date, string $startTime, string $endTime, int $intervalMinutes, int $durationMinutes): Collection
    {
        $windowStart = Carbon::instance($date->toDateTime())->setTimeFromTimeString($startTime);
        $windowEnd = Carbon::instance($date->toDateTime())->setTimeFromTimeString($endTime);

        if ($windowEnd->lte($windowStart) || $intervalMinutes <= 0) {
            return collect();
        }

        $cursor = $windowStart->copy();
        $slots = collect();

        while ($cursor->copy()->addMinutes($durationMinutes)->lte($windowEnd)) {
            $slotEnd = $cursor->copy()->addMinutes($durationMinutes);
            $slots->push([
                'starts_at' => $cursor->toISOString(),
                'ends_at' => $slotEnd->toISOString(),
            ]);
            $cursor->addMinutes($intervalMinutes);
        }

        return $slots;
    }

    protected function overlaps(CarbonInterface $startA, CarbonInterface $endA, CarbonInterface $startB, CarbonInterface $endB): bool
    {
        return $startA->lt($endB) && $endA->gt($startB);
    }

    protected function weekdayIndex(CarbonInterface $date): int
    {
        return ((int) $date->dayOfWeekIso) - 1;
    }

    protected function expirationMoment(CarbonInterface $startsAt): CarbonInterface
    {
        $appointmentStart = Carbon::instance($startsAt->toDateTime());
        $twelveHoursFromNow = now()->addHours(12);
        $twoHoursBeforeStart = $appointmentStart->copy()->subHours(2);

        return $twelveHoursFromNow->lessThan($twoHoursBeforeStart)
            ? $twelveHoursFromNow
            : $twoHoursBeforeStart;
    }
}
