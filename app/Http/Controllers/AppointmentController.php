<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Support\MilestoneService;
use App\Support\NotificationService;
use App\Support\PsychologistBookingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function __construct(
        protected NotificationService $notifications,
        protected MilestoneService $milestones,
        protected PsychologistBookingService $booking,
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

        $appointment = $this->booking->createAppointmentForUser(
            $request->user(),
            (int) $psychologist->id,
            (int) $validated['appointment_type_id'],
            Carbon::createFromFormat('Y-m-d H:i', "{$validated['date']} {$validated['time']}", config('app.timezone'))
        );

        $scheduledFor = optional($appointment->starts_at)->format('d.m.Y H:i');
        $baseKey = "appointment:{$request->user()->id}:{$appointment->id}";

        $this->notifications->publishToUser($request->user()->id, 'appointment_created', [
            'title' => 'Programare confirmata',
            'body' => "Programarea ta {$appointment->type} a fost salvata pentru {$scheduledFor}.",
            'category' => 'appointment',
            'icon' => 'FiCalendar',
            'icon_color' => 'peach',
            'trigger_type' => 'appointment',
            'trigger_id' => (string) $appointment->id,
            'dedupe_key' => $baseKey.':created',
            'cta_kind' => 'open',
            'cta_payload' => ['href' => "/appointments?psychologist={$validated['psychologist']}", 'label' => 'Vezi programarile'],
        ]);

        if ($appointment->starts_at) {
            $this->notifications->publishToUser($request->user()->id, 'appointment_reminder_24h', [
                'title' => 'Reminder programare',
                'body' => "Urmeaza programarea ta pe {$scheduledFor}.",
                'category' => 'appointment',
                'icon' => 'FiClock',
                'icon_color' => 'peach',
                'trigger_type' => 'appointment',
                'trigger_id' => (string) $appointment->id,
                'published_at' => $appointment->starts_at->copy()->subDay(),
                'expires_at' => $appointment->starts_at,
                'dedupe_key' => $baseKey.':24h',
                'cta_kind' => 'open',
                'cta_payload' => ['href' => "/appointments?psychologist={$validated['psychologist']}", 'label' => 'Deschide agenda'],
            ]);
            $this->notifications->publishToUser($request->user()->id, 'appointment_reminder_2h', [
                'title' => 'Programarea incepe curand',
                'body' => "Mai sunt aproximativ 2 ore pana la programarea ta de la {$scheduledFor}.",
                'category' => 'appointment',
                'icon' => 'FiClock',
                'icon_color' => 'coral',
                'trigger_type' => 'appointment',
                'trigger_id' => (string) $appointment->id,
                'published_at' => $appointment->starts_at->copy()->subHours(2),
                'expires_at' => $appointment->starts_at,
                'dedupe_key' => $baseKey.':2h',
                'cta_kind' => 'open',
                'cta_payload' => ['href' => "/appointments?psychologist={$validated['psychologist']}", 'label' => 'Vezi detaliile'],
            ]);
        }

        $this->milestones->syncForUser($request->user()->id);

        return back()->with('status', 'Programarea a fost salvata.');
    }

    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_unless($appointment->user_id === $request->user()->id, 404);
        abort_if($appointment->status !== 'scheduled', 422, 'Programarea nu mai poate fi anulata.');

        $appointment->update([
            'status' => 'cancelled_by_user',
        ]);

        return back()->with('status', 'Programarea a fost anulata.');
    }
}
