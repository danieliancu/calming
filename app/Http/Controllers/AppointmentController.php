<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Support\AppointmentLifecycleService;
use App\Support\AppointmentReminderService;
use App\Support\MilestoneService;
use App\Support\NotificationService;
use App\Support\PsychologistBookingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class AppointmentController extends Controller
{
    public function __construct(
        protected NotificationService $notifications,
        protected MilestoneService $milestones,
        protected PsychologistBookingService $booking,
        protected AppointmentLifecycleService $lifecycle,
        protected AppointmentReminderService $reminders,
    ) {
    }

    public function availability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'psychologist' => ['required', 'string', 'max:160'],
            'type' => ['required', 'integer'],
            'month' => ['required', 'date_format:Y-m'],
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $psychologist = $this->booking->approvedPsychologistBySlug($validated['psychologist']);
        abort_unless($psychologist, 404, 'Specialistul selectat nu este disponibil.');

        return response()->json(
            $this->booking->availabilitySnapshot(
                (int) $psychologist->id,
                (int) $validated['type'],
                Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth(),
                ! empty($validated['date']) ? Carbon::createFromFormat('Y-m-d', $validated['date'])->startOfDay() : null,
            )
        );
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'psychologist' => ['required', 'string', 'max:160'],
            'appointment_type_id' => ['required', 'integer'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
        ]);

        $psychologist = $this->booking->approvedPsychologistBySlug($validated['psychologist']);
        abort_unless($psychologist, 404, 'Specialistul selectat nu este disponibil.');

        $appointment = $this->lifecycle->createPendingForUser(
            $request->user(),
            (int) $psychologist->id,
            (int) $validated['appointment_type_id'],
            Carbon::createFromFormat('Y-m-d H:i', "{$validated['date']} {$validated['time']}", config('app.timezone'))
        );

        return back()->with('status', 'Cererea de programare a fost trimisa.');
    }

    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_unless($appointment->user_id === $request->user()->id, 404);
        abort_if(! in_array($appointment->status, [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED], true), 422, 'Programarea nu mai poate fi anulata.');
        abort_if(optional($appointment->starts_at ?? $appointment->scheduled_for)?->lessThanOrEqualTo(now()), 422, 'Programarea nu mai poate fi anulată după ora de start.');

        $this->lifecycle->cancelByUser($appointment, $request->user());

        return back()->with('status', 'Programarea a fost anulata.');
    }

    public function updateReminderPreferences(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_unless($appointment->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'minutes_before' => ['nullable'],
        ]);

        $this->reminders->updatePreference(
            $appointment,
            'user',
            $validated['minutes_before'] ?? null,
        );

        return back()->with('status', 'Reminderul pentru programare a fost actualizat.');
    }

    protected function appointmentsUrl(string $psychologistSlug): string
    {
        return Route::has('appointments')
            ? route('appointments', ['psychologist' => $psychologistSlug], false)
            : "/appointments?psychologist={$psychologistSlug}";
    }
}
