<?php

namespace App\Support;

use App\Models\Appointment;
use Illuminate\Support\Collection;

class UserAppointmentPresenter
{
    public function forUser(int $userId): Collection
    {
        return Appointment::query()
            ->where('user_id', $userId)
            ->with(['psychologist', 'appointmentType', 'reminderPreferences'])
            ->orderBy('starts_at')
            ->get()
            ->map(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'psychologist_slug' => $appointment->psychologist?->slug,
                'psychologist_name' => $appointment->psychologist_name,
                'type' => $appointment->type,
                'location_mode' => $appointment->location_mode,
                'scheduled_for' => optional($appointment->starts_at ?? $appointment->scheduled_for)->format('d.m.Y H:i'),
                'status' => $appointment->status,
                'payment_status' => $appointment->payment_status,
                'total_amount' => (float) $appointment->total_amount,
                'currency' => $appointment->currency,
                'expires_at' => optional($appointment->expires_at)->format('d.m.Y H:i'),
                'reminder_minutes' => optional($appointment->reminderPreferences->firstWhere('actor_type', 'user'))->minutes_before,
                'can_cancel' => in_array($appointment->status, [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED], true)
                    && optional($appointment->starts_at ?? $appointment->scheduled_for)?->isFuture(),
            ]);
    }
}
