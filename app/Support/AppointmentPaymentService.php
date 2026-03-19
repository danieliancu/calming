<?php

namespace App\Support;

use App\Models\Appointment;
use App\Models\Payment;
use App\Models\Refund;

class AppointmentPaymentService
{
    public function initializeForAppointment(Appointment $appointment): ?Payment
    {
        if ((float) $appointment->total_amount <= 0) {
            $appointment->forceFill([
                'payment_status' => 'not_required',
                'payment_reference' => null,
            ])->save();

            return null;
        }

        $payment = Payment::query()->updateOrCreate(
            ['appointment_id' => $appointment->id],
            [
                'provider' => 'platform_placeholder',
                'provider_reference' => "payment-appointment-{$appointment->id}",
                'status' => 'authorized',
                'amount' => $appointment->total_amount,
                'platform_fee_amount' => $appointment->platform_fee_amount,
                'psychologist_payout_amount' => $appointment->psychologist_payout_amount,
                'currency' => $appointment->currency,
                'authorized_at' => now(),
                'meta' => ['mode' => 'local_placeholder'],
            ],
        );

        $appointment->forceFill([
            'payment_status' => 'authorized',
            'payment_reference' => $payment->provider_reference,
        ])->save();

        return $payment;
    }

    public function captureForAppointment(Appointment $appointment): ?Payment
    {
        $payment = $appointment->payment;
        if (! $payment) {
            return null;
        }

        if ($payment->status === 'captured') {
            return $payment;
        }

        $payment->forceFill([
            'status' => 'captured',
            'captured_at' => now(),
        ])->save();

        $appointment->forceFill([
            'payment_status' => 'captured',
            'payment_reference' => $payment->provider_reference,
        ])->save();

        return $payment;
    }

    public function voidForAppointment(Appointment $appointment, ?string $reason = null): ?Payment
    {
        $payment = $appointment->payment;
        if (! $payment) {
            return null;
        }

        if (in_array($payment->status, ['voided', 'refunded'], true)) {
            return $payment;
        }

        $payment->forceFill([
            'status' => 'voided',
            'voided_at' => now(),
            'meta' => array_filter([
                ...($payment->meta ?? []),
                'void_reason' => $reason,
            ]),
        ])->save();

        $appointment->forceFill([
            'payment_status' => 'voided',
        ])->save();

        return $payment;
    }

    public function refundForAppointment(Appointment $appointment, float $amount, ?string $reason = null): ?Refund
    {
        $payment = $appointment->payment;
        if (! $payment) {
            return null;
        }

        $refund = Refund::query()->create([
            'payment_id' => $payment->id,
            'appointment_id' => $appointment->id,
            'amount' => $amount,
            'currency' => $appointment->currency,
            'status' => 'processed',
            'reason' => $reason,
            'processed_at' => now(),
            'meta' => ['mode' => 'local_placeholder'],
        ]);

        $payment->forceFill([
            'status' => 'refunded',
            'refunded_at' => now(),
        ])->save();

        $appointment->forceFill([
            'payment_status' => 'refunded',
        ])->save();

        return $refund;
    }

    public function platformFeeRate(): float
    {
        return 0.15;
    }
}
