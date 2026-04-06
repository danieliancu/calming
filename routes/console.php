<?php

use App\Support\AppointmentEmailService;
use App\Support\AppointmentLifecycleService;
use App\Support\AppointmentReminderService;
use App\Support\NotificationService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
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

Artisan::command('psychologists:import-csv {path : Absolute or relative path to the CSV file} {--truncate : Empty psychologist_imports before import}', function () {
    $pathArgument = (string) $this->argument('path');
    $path = str_starts_with($pathArgument, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\\/]/', $pathArgument)
        ? $pathArgument
        : base_path($pathArgument);

    if (! is_file($path) || ! is_readable($path)) {
        $this->error("CSV file not found or not readable: {$path}");
        return 1;
    }

    $handle = fopen($path, 'rb');

    if ($handle === false) {
        $this->error("Could not open CSV file: {$path}");
        return 1;
    }

    $expectedHeader = [
        'attestation_number',
        'license_issue_date',
        'rupa_code',
        'name',
        'specialty_commission',
        'specialization',
        'professional_grade',
        'practice_regime',
        'phone',
        'professional_email',
        'city',
    ];

    $header = fgetcsv($handle);

    if ($header === false) {
        fclose($handle);
        $this->error('CSV file is empty.');
        return 1;
    }

    $header = array_map(function ($value) {
        $value = (string) $value;
        $value = preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value;

        return trim($value);
    }, $header);

    if ($header !== $expectedHeader) {
        fclose($handle);
        $this->error('Unexpected CSV header.');
        $this->line('Expected: '.implode(', ', $expectedHeader));
        $this->line('Actual: '.implode(', ', $header));
        return 1;
    }

    if ($this->option('truncate')) {
        DB::table('psychologist_imports')->truncate();
        $this->warn('psychologist_imports truncated before import.');
    }

    $inserted = 0;
    $updated = 0;
    $skipped = 0;
    $lineNumber = 1;

    while (($row = fgetcsv($handle)) !== false) {
        $lineNumber += 1;

        if ($row === [null] || count(array_filter($row, fn ($value) => trim((string) $value) !== '')) === 0) {
            continue;
        }

        if (count($row) < count($expectedHeader)) {
            $skipped += 1;
            $this->warn("Skipped line {$lineNumber}: column count is too small.");
            continue;
        }

        $row = array_slice($row, 0, count($expectedHeader));
        $row = array_map(fn ($value) => trim((string) $value), $row);
        $payload = array_combine($expectedHeader, $row);

        if ($payload === false || $payload['attestation_number'] === '' || $payload['name'] === '') {
            $skipped += 1;
            $this->warn("Skipped line {$lineNumber}: missing attestation_number or name.");
            continue;
        }

        $licenseIssueDate = null;
        if ($payload['license_issue_date'] !== '') {
            $parts = explode('.', $payload['license_issue_date']);
            if (count($parts) === 3) {
                [$day, $month, $year] = $parts;
                $licenseIssueDate = checkdate((int) $month, (int) $day, (int) $year)
                    ? sprintf('%04d-%02d-%02d', (int) $year, (int) $month, (int) $day)
                    : null;
            }
        }

        $phone = $payload['phone'];
        if ($phone !== '') {
            $phone = preg_split('/[;,]/', $phone)[0] ?? $phone;
            $phone = trim($phone);
        }

        $existing = DB::table('psychologist_imports')
            ->where('attestation_number', $payload['attestation_number'])
            ->first(['id']);

        $values = [
            'license_issue_date' => $licenseIssueDate,
            'rupa_code' => $payload['rupa_code'] !== '' ? $payload['rupa_code'] : null,
            'name' => $payload['name'],
            'specialty_commission' => $payload['specialty_commission'] !== '' ? $payload['specialty_commission'] : null,
            'specialization' => $payload['specialization'] !== '' ? $payload['specialization'] : null,
            'professional_grade' => $payload['professional_grade'] !== '' ? $payload['professional_grade'] : null,
            'practice_regime' => $payload['practice_regime'] !== '' ? $payload['practice_regime'] : null,
            'phone' => $phone !== '' ? $phone : null,
            'professional_email' => $payload['professional_email'] !== '' ? $payload['professional_email'] : null,
            'city' => $payload['city'] !== '' ? $payload['city'] : null,
            'updated_at' => now(),
        ];

        if ($existing) {
            DB::table('psychologist_imports')
                ->where('id', $existing->id)
                ->update($values);
            $updated += 1;
        } else {
            DB::table('psychologist_imports')->insert([
                'attestation_number' => $payload['attestation_number'],
                ...$values,
                'is_registered' => false,
                'registered_psychologist_id' => null,
                'registered_at' => null,
                'created_at' => now(),
            ]);
            $inserted += 1;
        }
    }

    fclose($handle);

    $this->info("Import finished. Inserted: {$inserted}, Updated: {$updated}, Skipped: {$skipped}");

    return 0;
})->purpose('Import psychologist CSV rows into psychologist_imports');

Schedule::command('appointments:expire-pending')->everyFiveMinutes();
Schedule::command('appointments:send-reminders')->everyMinute();
