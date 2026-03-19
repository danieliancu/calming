<?php

use App\Support\AppointmentEmailService;
use App\Support\AppointmentLifecycleService;
use App\Support\AppointmentReminderService;
use App\Support\NotificationService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('appointments:expire-pending', function (AppointmentLifecycleService $lifecycle) {
    $expired = $lifecycle->expirePendingRequests();

    $this->info("Expired {$expired->count()} pending appointments.");
})->purpose('Expire pending appointment requests that passed their confirmation window');

Artisan::command('appointments:send-reminders', function (
    AppointmentReminderService $reminders,
    NotificationService $notifications,
    AppointmentEmailService $emails,
) {
    $count = $reminders->sendDueReminders($notifications, $emails);

    $this->info("Sent {$count} appointment reminders.");
})->purpose('Send due appointment reminders by email and in-app notifications');

Schedule::command('appointments:expire-pending')->everyFiveMinutes();
Schedule::command('appointments:send-reminders')->everyMinute();
