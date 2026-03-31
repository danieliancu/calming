<?php

namespace App\Support;

use App\Models\Appointment;
use App\Models\AppointmentReminderPreference;
use App\Models\Psychologist;
use App\Models\User;
use Carbon\CarbonInterval;
use Illuminate\Support\Facades\DB;

class AppointmentReminderService
{
    public function syncDefaults(Appointment $appointment, User $user, Psychologist $psychologist): void
    {
        AppointmentReminderPreference::query()->updateOrCreate(
            ['appointment_id' => $appointment->id, 'actor_type' => 'user'],
            [
                'user_id' => $user->id,
                'psychologist_id' => null,
                'minutes_before' => 24 * 60,
                'email_enabled' => true,
                'last_sent_at' => null,
            ],
        );

        AppointmentReminderPreference::query()->updateOrCreate(
            ['appointment_id' => $appointment->id, 'actor_type' => 'psychologist'],
            [
                'user_id' => null,
                'psychologist_id' => $psychologist->id,
                'minutes_before' => 24 * 60,
                'email_enabled' => true,
                'last_sent_at' => null,
            ],
        );
    }

    public function updatePreference(Appointment $appointment, string $actorType, int|string|null $minutesBefore, bool $emailEnabled = true): void
    {
        $isDisabled = $minutesBefore === null || $minutesBefore === '' || $minutesBefore === 'none';

        $attributes = [
            'minutes_before' => $isDisabled ? null : (int) $minutesBefore,
            'email_enabled' => ! $isDisabled && $emailEnabled,
            'last_sent_at' => null,
        ];

        if ($actorType === 'psychologist') {
            AppointmentReminderPreference::query()->updateOrCreate(
                ['appointment_id' => $appointment->id, 'actor_type' => 'psychologist'],
                [
                    ...$attributes,
                    'psychologist_id' => $appointment->psychologist_id,
                    'user_id' => null,
                ],
            );

            return;
        }

        AppointmentReminderPreference::query()->updateOrCreate(
            ['appointment_id' => $appointment->id, 'actor_type' => 'user'],
            [
                ...$attributes,
                'user_id' => $appointment->user_id,
                'psychologist_id' => null,
            ],
        );
    }

    public function duePreferences()
    {
        return AppointmentReminderPreference::query()
            ->with(['appointment.user', 'appointment.psychologist'])
            ->where('email_enabled', true)
            ->whereNotNull('minutes_before')
            ->whereNull('last_sent_at')
            ->whereHas('appointment', function ($query) {
                $query
                    ->where('status', Appointment::STATUS_CONFIRMED)
                    ->whereNotNull('starts_at')
                    ->where('starts_at', '>', now());
            })
            ->get()
            ->filter(function (AppointmentReminderPreference $preference) {
                $appointment = $preference->appointment;
                if (! $appointment?->starts_at) {
                    return false;
                }

                $minutesUntilStart = now()->diffInMinutes($appointment->starts_at, false);
                if ($minutesUntilStart < 0) {
                    return false;
                }

                if ($minutesUntilStart > (int) $preference->minutes_before) {
                    return false;
                }

                if ($preference->actor_type === 'user') {
                    $preferences = DB::table('notification_preferences')->where('user_id', $appointment->user_id)->first();

                    return ($preferences->allow_appointments ?? true) && ($preferences->allow_reminders ?? true);
                }

                return true;
            });
    }

    public function sendDueReminders(NotificationService $notifications, AppointmentEmailService $emails): int
    {
        $count = 0;

        foreach ($this->duePreferences() as $preference) {
            $appointment = $preference->appointment;
            $minutesBefore = (int) $preference->minutes_before;
            $dedupeKey = "appointment:{$appointment->id}:reminder:{$preference->actor_type}:{$minutesBefore}";

            if ($preference->actor_type === 'user') {
                $notifications->publishToUser($appointment->user_id, 'appointment_reminder_24h', [
                    'title' => 'Reminder programare',
                    'body' => "Programarea pentru {$appointment->type} începe ".CarbonInterval::minutes($minutesBefore)->cascade()->forHumans(short: true).'.',
                    'category' => 'appointment',
                    'trigger_type' => 'appointment',
                    'trigger_id' => (string) $appointment->id,
                    'dedupe_key' => $dedupeKey,
                    'cta_kind' => 'open',
                    'cta_payload' => ['href' => '/appointments', 'label' => 'Vezi sesiunile programate'],
                ]);
            }

            $emails->sendReminder($appointment, $preference->actor_type, $minutesBefore);
            $preference->forceFill(['last_sent_at' => now()])->save();
            $count += 1;
        }

        return $count;
    }
}
