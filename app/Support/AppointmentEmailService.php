<?php

namespace App\Support;

use App\Mail\AppointmentMessageMail;
use App\Models\Appointment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AppointmentEmailService
{
    public function sendRequestCreatedToUser(Appointment $appointment): void
    {
        $user = $appointment->user;
        if (! $user?->email) {
            return;
        }

        $this->sendSafely($user->email, new AppointmentMessageMail(
            'Cererea ta de programare a fost trimisa',
            'Cererea de programare a fost trimisa',
            "Am inregistrat cererea ta pentru {$appointment->type} pe {$appointment->starts_at?->format('d.m.Y H:i')}.\nSpecialistul trebuie sa confirme rezervarea.",
            $this->appointmentsUrl($appointment),
            'Vezi sesiunile programate',
        ));
    }

    public function sendRequestCreatedToPsychologist(Appointment $appointment): void
    {
        $psychologist = $appointment->psychologist;
        if (! $psychologist?->email) {
            return;
        }

        $this->sendSafely($psychologist->email, new AppointmentMessageMail(
            'Ai o noua cerere de programare',
            'Cerere noua de programare',
            "Ai primit o cerere pentru {$appointment->type} pe {$appointment->starts_at?->format('d.m.Y H:i')}.\nIntra in dashboard pentru a confirma sau respinge.",
            $this->psychologistDashboardUrl(),
            'Deschide dashboard-ul',
        ));
    }

    public function sendConfirmedToUser(Appointment $appointment): void
    {
        $user = $appointment->user;
        if (! $user?->email) {
            return;
        }

        $this->sendSafely($user->email, new AppointmentMessageMail(
            'Programarea ta a fost confirmata',
            'Programarea a fost confirmata',
            "Programarea pentru {$appointment->type} a fost confirmata de specialist.\nData si ora: {$appointment->starts_at?->format('d.m.Y H:i')}.",
            $this->appointmentsUrl($appointment),
            'Vezi programarea',
        ));
    }

    public function sendDeclinedToUser(Appointment $appointment): void
    {
        $user = $appointment->user;
        if (! $user?->email) {
            return;
        }

        $this->sendSafely($user->email, new AppointmentMessageMail(
            'Cererea ta de programare a fost respinsa',
            'Cererea a fost respinsa',
            "Cererea pentru {$appointment->type} din {$appointment->starts_at?->format('d.m.Y H:i')} nu a fost confirmata de specialist.",
            $this->appointmentsUrl($appointment),
            'Vezi sesiunile programate',
        ));
    }

    public function sendCancelledToUser(Appointment $appointment, string $reasonText): void
    {
        $user = $appointment->user;
        if (! $user?->email) {
            return;
        }

        $this->sendSafely($user->email, new AppointmentMessageMail(
            'Programarea ta a fost anulata',
            'Programarea a fost anulata',
            "Programarea pentru {$appointment->type} din {$appointment->starts_at?->format('d.m.Y H:i')} a fost anulata.\n{$reasonText}",
            $this->appointmentsUrl($appointment),
            'Vezi sesiunile programate',
        ));
    }

    public function sendCancelledToPsychologist(Appointment $appointment, string $reasonText): void
    {
        $psychologist = $appointment->psychologist;
        if (! $psychologist?->email) {
            return;
        }

        $this->sendSafely($psychologist->email, new AppointmentMessageMail(
            'O programare a fost anulata',
            'Programarea a fost anulata',
            "Programarea pentru {$appointment->type} din {$appointment->starts_at?->format('d.m.Y H:i')} a fost anulata.\n{$reasonText}",
            $this->psychologistDashboardUrl(),
            'Deschide dashboard-ul',
        ));
    }

    public function sendExpiredToUser(Appointment $appointment): void
    {
        $user = $appointment->user;
        if (! $user?->email) {
            return;
        }

        $this->sendSafely($user->email, new AppointmentMessageMail(
            'Cererea ta de programare a expirat',
            'Cererea de programare a expirat',
            "Cererea pentru {$appointment->type} din {$appointment->starts_at?->format('d.m.Y H:i')} a expirat fara confirmare.",
            $this->appointmentsUrl($appointment),
            'Vezi sesiunile programate',
        ));
    }

    public function sendReminder(Appointment $appointment, string $recipientType, int $minutesBefore): void
    {
        $subject = $minutesBefore >= 60
            ? 'Reminder programare peste '.(int) round($minutesBefore / 60).'h'
            : "Reminder programare peste {$minutesBefore}m";

        $body = "Programarea pentru {$appointment->type} incepe la {$appointment->starts_at?->format('d.m.Y H:i')}.";

        if ($recipientType === 'psychologist') {
            $psychologist = $appointment->psychologist;
            if (! $psychologist?->email) {
                return;
            }

            $this->sendSafely($psychologist->email, new AppointmentMessageMail(
                $subject,
                'Reminder programare',
                $body,
                $this->psychologistDashboardUrl(),
                'Deschide dashboard-ul',
            ));

            return;
        }

        $user = $appointment->user;
        if (! $user?->email) {
            return;
        }

        $this->sendSafely($user->email, new AppointmentMessageMail(
            $subject,
            'Reminder programare',
            $body,
            $this->appointmentsUrl($appointment),
            'Vezi sesiunile programate',
        ));
    }

    protected function sendSafely(string $email, AppointmentMessageMail $mailable): void
    {
        try {
            Mail::mailer(config('mail.default', 'failover'))
                ->to($email)
                ->send($mailable);
        } catch (\Throwable $exception) {
            Log::warning('Appointment email failed', [
                'email' => $email,
                'subject' => $mailable->subjectLine,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    protected function appointmentsUrl(Appointment $appointment): string
    {
        $psychologistSlug = $appointment->psychologist?->slug;

        if (! $psychologistSlug) {
            return route('appointments');
        }

        return route('appointments', ['psychologist' => $psychologistSlug]);
    }

    protected function psychologistDashboardUrl(): string
    {
        return route('psychologists.dashboard', ['section' => 'schedule']);
    }
}
