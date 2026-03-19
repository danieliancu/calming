<?php

namespace App\Support;

use App\Models\Appointment;
use App\Models\AppointmentReminderPreference;
use App\Models\AppointmentStatusHistory;
use App\Models\Psychologist;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AppointmentLifecycleService
{
    public function __construct(
        protected NotificationService $notifications,
        protected MilestoneService $milestones,
        protected AppointmentPaymentService $payments,
        protected AppointmentReminderService $reminders,
        protected AppointmentEmailService $emails,
        protected PsychologistBookingService $booking,
    ) {
    }

    public function createPendingForUser(User $user, int $psychologistId, int $typeId, CarbonInterface $startsAt): Appointment
    {
        return DB::transaction(function () use ($user, $psychologistId, $typeId, $startsAt) {
            $appointment = $this->booking->createAppointmentRequestForUser($user, $psychologistId, $typeId, $startsAt);
            $appointment->load(['user', 'psychologist']);

            $this->writeHistory($appointment, null, Appointment::STATUS_PENDING, 'user', $user->id, 'Cerere noua');
            $this->payments->initializeForAppointment($appointment);
            $this->reminders->syncDefaults($appointment, $user, $appointment->psychologist);
            $this->publishCreatedNotifications($appointment);
            $this->emails->sendRequestCreatedToUser($appointment);
            $this->emails->sendRequestCreatedToPsychologist($appointment);

            return $appointment;
        });
    }

    public function confirmByPsychologist(Appointment $appointment, Psychologist $psychologist): Appointment
    {
        $appointment->loadMissing(['user', 'psychologist']);

        if ($appointment->status !== Appointment::STATUS_PENDING) {
            return $appointment;
        }

        $previousStatus = $appointment->status;
        $appointment->forceFill([
            'status' => Appointment::STATUS_CONFIRMED,
            'confirmed_at' => now(),
            'expires_at' => null,
        ])->save();

        $this->payments->captureForAppointment($appointment);
        $this->writeHistory($appointment, $previousStatus, Appointment::STATUS_CONFIRMED, 'psychologist', $psychologist->id, 'Confirmata de specialist');
        $this->publishConfirmedNotifications($appointment);
        $this->emails->sendConfirmedToUser($appointment);
        $this->milestones->syncForUser($appointment->user_id);

        return $appointment;
    }

    public function declineByPsychologist(Appointment $appointment, Psychologist $psychologist, ?string $reason = null): Appointment
    {
        $appointment->loadMissing(['user', 'psychologist']);

        if ($appointment->status !== Appointment::STATUS_PENDING) {
            return $appointment;
        }

        $previousStatus = $appointment->status;
        $appointment->forceFill([
            'status' => Appointment::STATUS_DECLINED_BY_PSYCHOLOGIST,
            'declined_at' => now(),
            'cancellation_reason' => $reason,
            'expires_at' => null,
        ])->save();

        $this->payments->voidForAppointment($appointment, $reason ?: 'declined_by_psychologist');
        $this->writeHistory($appointment, $previousStatus, Appointment::STATUS_DECLINED_BY_PSYCHOLOGIST, 'psychologist', $psychologist->id, $reason ?: 'Respinsa de specialist');
        $this->publishDeclinedNotifications($appointment);
        $this->emails->sendDeclinedToUser($appointment);

        return $appointment;
    }

    public function cancelByUser(Appointment $appointment, User $user, ?string $reason = null): Appointment
    {
        $appointment->loadMissing(['user', 'psychologist']);

        if (! in_array($appointment->status, [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED], true)) {
            return $appointment;
        }

        $previousStatus = $appointment->status;
        $appointment->forceFill([
            'status' => Appointment::STATUS_CANCELLED_BY_USER,
            'cancelled_at' => now(),
            'cancellation_actor_type' => 'user',
            'cancellation_reason' => $reason,
        ])->save();

        if ($previousStatus === Appointment::STATUS_PENDING) {
            $this->payments->voidForAppointment($appointment, 'cancelled_by_user_pending');
        } else {
            $refundAmount = $this->refundAmountForUserCancellation($appointment);
            if ($refundAmount > 0) {
                $this->payments->refundForAppointment($appointment, $refundAmount, $reason ?: 'user_cancelled');
            }
        }

        $this->writeHistory($appointment, $previousStatus, Appointment::STATUS_CANCELLED_BY_USER, 'user', $user->id, $reason ?: 'Anulata de utilizator');
        $this->publishCancelledNotifications($appointment, 'user');
        $this->emails->sendCancelledToPsychologist($appointment, 'Clientul a anulat programarea.');

        return $appointment;
    }

    public function cancelByPsychologist(Appointment $appointment, Psychologist $psychologist, ?string $reason = null): Appointment
    {
        $appointment->loadMissing(['user', 'psychologist']);

        if (! in_array($appointment->status, [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED], true)) {
            return $appointment;
        }

        $previousStatus = $appointment->status;
        $appointment->forceFill([
            'status' => Appointment::STATUS_CANCELLED_BY_PSYCHOLOGIST,
            'cancelled_at' => now(),
            'cancellation_actor_type' => 'psychologist',
            'cancellation_reason' => $reason,
        ])->save();

        if ($previousStatus === Appointment::STATUS_PENDING) {
            $this->payments->voidForAppointment($appointment, 'cancelled_by_psychologist_pending');
        } elseif ((float) $appointment->total_amount > 0) {
            $this->payments->refundForAppointment($appointment, (float) $appointment->total_amount, $reason ?: 'psychologist_cancelled');
        }

        $this->writeHistory($appointment, $previousStatus, Appointment::STATUS_CANCELLED_BY_PSYCHOLOGIST, 'psychologist', $psychologist->id, $reason ?: 'Anulata de specialist');
        $this->publishCancelledNotifications($appointment, 'psychologist');
        $this->emails->sendCancelledToUser($appointment, 'Specialistul a anulat programarea.');

        return $appointment;
    }

    public function markCompleted(Appointment $appointment, Psychologist $psychologist): Appointment
    {
        return $this->transitionManagedStatus($appointment, $psychologist, Appointment::STATUS_COMPLETED, 'Marcata ca finalizata');
    }

    public function markNoShow(Appointment $appointment, Psychologist $psychologist): Appointment
    {
        return $this->transitionManagedStatus($appointment, $psychologist, Appointment::STATUS_NO_SHOW, 'Marcata ca no-show');
    }

    public function expirePendingRequests(): Collection
    {
        $appointments = Appointment::query()
            ->where('status', Appointment::STATUS_PENDING)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();

        return $appointments->map(function (Appointment $appointment) {
            $appointment->loadMissing(['user', 'psychologist']);
            $previousStatus = $appointment->status;
            $appointment->forceFill([
                'status' => Appointment::STATUS_EXPIRED,
                'cancelled_at' => now(),
                'expires_at' => null,
                'cancellation_actor_type' => 'system',
                'cancellation_reason' => 'Cererea a expirat fara confirmare.',
            ])->save();

            $this->payments->voidForAppointment($appointment, 'expired');
            $this->writeHistory($appointment, $previousStatus, Appointment::STATUS_EXPIRED, 'system', null, 'Cerere expirata');
            $this->publishExpiredNotifications($appointment);
            $this->emails->sendExpiredToUser($appointment);

            return $appointment;
        });
    }

    protected function transitionManagedStatus(Appointment $appointment, Psychologist $psychologist, string $targetStatus, string $note): Appointment
    {
        if (! in_array($appointment->status, [Appointment::STATUS_CONFIRMED, Appointment::STATUS_NO_SHOW], true)) {
            return $appointment;
        }

        $previousStatus = $appointment->status;
        $appointment->forceFill([
            'status' => $targetStatus,
        ])->save();

        $this->writeHistory($appointment, $previousStatus, $targetStatus, 'psychologist', $psychologist->id, $note);

        return $appointment;
    }

    protected function refundAmountForUserCancellation(Appointment $appointment): float
    {
        $startsAt = $appointment->starts_at;
        if (! $startsAt) {
            return 0.0;
        }

        return now()->diffInHours($startsAt, false) >= 24
            ? (float) $appointment->total_amount
            : 0.0;
    }

    protected function publishCreatedNotifications(Appointment $appointment): void
    {
        $baseKey = "appointment:{$appointment->id}";
        $appointmentsUrl = $this->appointmentsUrl($appointment->psychologist?->slug);

        $this->notifications->publishToUser($appointment->user_id, 'appointment_created', [
            'title' => 'Cerere trimisa',
            'body' => "Cererea pentru {$appointment->type} a fost trimisa si asteapta confirmarea specialistului.",
            'category' => 'appointment',
            'trigger_type' => 'appointment',
            'trigger_id' => (string) $appointment->id,
            'dedupe_key' => $baseKey.':pending',
            'cta_kind' => 'open',
            'cta_payload' => ['href' => $appointmentsUrl, 'label' => 'Vezi sesiunile programate'],
        ]);
    }

    protected function publishConfirmedNotifications(Appointment $appointment): void
    {
        $this->notifications->publishToUser($appointment->user_id, 'appointment_created', [
            'title' => 'Programare confirmata',
            'body' => "Programarea pentru {$appointment->type} a fost confirmata pentru {$appointment->starts_at?->format('d.m.Y H:i')}.",
            'category' => 'appointment',
            'trigger_type' => 'appointment',
            'trigger_id' => (string) $appointment->id,
            'dedupe_key' => "appointment:{$appointment->id}:confirmed",
            'cta_kind' => 'open',
            'cta_payload' => ['href' => $this->appointmentsUrl($appointment->psychologist?->slug), 'label' => 'Vezi programarea'],
        ]);
    }

    protected function publishDeclinedNotifications(Appointment $appointment): void
    {
        $this->notifications->publishToUser($appointment->user_id, 'appointment_created', [
            'title' => 'Cerere respinsa',
            'body' => "Cererea pentru {$appointment->type} nu a fost confirmata de specialist.",
            'category' => 'appointment',
            'trigger_type' => 'appointment',
            'trigger_id' => (string) $appointment->id,
            'dedupe_key' => "appointment:{$appointment->id}:declined",
            'cta_kind' => 'open',
            'cta_payload' => ['href' => $this->appointmentsUrl($appointment->psychologist?->slug), 'label' => 'Vezi sesiunile programate'],
        ]);
    }

    protected function publishCancelledNotifications(Appointment $appointment, string $actor): void
    {
        $body = $actor === 'psychologist'
            ? "Programarea pentru {$appointment->type} a fost anulata de specialist."
            : "Ai anulat programarea pentru {$appointment->type}.";

        $this->notifications->publishToUser($appointment->user_id, 'appointment_created', [
            'title' => 'Programare anulata',
            'body' => $body,
            'category' => 'appointment',
            'trigger_type' => 'appointment',
            'trigger_id' => (string) $appointment->id,
            'dedupe_key' => "appointment:{$appointment->id}:cancelled:{$actor}",
            'cta_kind' => 'open',
            'cta_payload' => ['href' => $this->appointmentsUrl($appointment->psychologist?->slug), 'label' => 'Vezi sesiunile programate'],
        ]);
    }

    protected function publishExpiredNotifications(Appointment $appointment): void
    {
        $this->notifications->publishToUser($appointment->user_id, 'appointment_created', [
            'title' => 'Cerere expirata',
            'body' => "Cererea pentru {$appointment->type} a expirat fara confirmare.",
            'category' => 'appointment',
            'trigger_type' => 'appointment',
            'trigger_id' => (string) $appointment->id,
            'dedupe_key' => "appointment:{$appointment->id}:expired",
            'cta_kind' => 'open',
            'cta_payload' => ['href' => $this->appointmentsUrl($appointment->psychologist?->slug), 'label' => 'Vezi sesiunile programate'],
        ]);
    }

    protected function writeHistory(Appointment $appointment, ?string $fromStatus, string $toStatus, ?string $actorType, ?int $actorId, ?string $note): void
    {
        AppointmentStatusHistory::query()->create([
            'appointment_id' => $appointment->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'note' => $note,
            'meta' => [
                'payment_status' => $appointment->payment_status,
            ],
            'changed_at' => now(),
        ]);
    }

    protected function appointmentsUrl(?string $psychologistSlug): string
    {
        if (! $psychologistSlug) {
            return '/appointments';
        }

        return "/appointments?psychologist={$psychologistSlug}";
    }
}
