<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('psychologist_appointment_types', function (Blueprint $table) {
            $table->decimal('price_amount', 10, 2)->default(0)->after('duration_minutes');
            $table->string('currency', 3)->default('RON')->after('price_amount');
            $table->boolean('is_paid_online')->default(true)->after('currency');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->timestamp('requested_at')->nullable()->after('ends_at');
            $table->timestamp('confirmed_at')->nullable()->after('requested_at');
            $table->timestamp('declined_at')->nullable()->after('confirmed_at');
            $table->timestamp('cancelled_at')->nullable()->after('declined_at');
            $table->timestamp('expires_at')->nullable()->after('cancelled_at');
            $table->string('cancellation_actor_type', 30)->nullable()->after('expires_at');
            $table->string('cancellation_reason', 190)->nullable()->after('cancellation_actor_type');
            $table->string('payment_status', 40)->default('not_required')->after('cancellation_reason');
            $table->string('payment_reference', 120)->nullable()->after('payment_status');
            $table->decimal('total_amount', 10, 2)->default(0)->after('payment_reference');
            $table->decimal('platform_fee_amount', 10, 2)->default(0)->after('total_amount');
            $table->decimal('psychologist_payout_amount', 10, 2)->default(0)->after('platform_fee_amount');
            $table->string('currency', 3)->default('RON')->after('psychologist_payout_amount');
        });

        Schema::create('appointment_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->string('from_status', 40)->nullable();
            $table->string('to_status', 40);
            $table->string('actor_type', 30)->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('note', 190)->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('changed_at')->useCurrent();
            $table->timestamps();
            $table->index(['appointment_id', 'changed_at'], 'appointment_status_history_lookup');
        });

        Schema::create('appointment_reminder_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->string('actor_type', 30);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('psychologist_id')->nullable()->constrained('psychologists')->nullOnDelete();
            $table->unsignedInteger('minutes_before')->nullable();
            $table->boolean('email_enabled')->default(true);
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamps();
            $table->unique(['appointment_id', 'actor_type'], 'appointment_reminder_actor_unique');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->string('provider', 40)->default('platform_placeholder');
            $table->string('provider_reference', 120)->nullable();
            $table->string('status', 40)->default('authorized');
            $table->decimal('amount', 10, 2)->default(0);
            $table->decimal('platform_fee_amount', 10, 2)->default(0);
            $table->decimal('psychologist_payout_amount', 10, 2)->default(0);
            $table->string('currency', 3)->default('RON');
            $table->timestamp('authorized_at')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->unique('appointment_id');
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('currency', 3)->default('RON');
            $table->string('status', 40)->default('processed');
            $table->string('reason', 190)->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        $types = DB::table('psychologist_appointment_types')->get();
        foreach ($types as $type) {
            $basePrice = match (true) {
                str_contains(mb_strtolower($type->label), 'evaluare') => 250,
                (int) $type->duration_minutes >= 80 => 320,
                (int) $type->duration_minutes >= 60 => 220,
                default => 180,
            };

            DB::table('psychologist_appointment_types')
                ->where('id', $type->id)
                ->update([
                    'price_amount' => $basePrice,
                    'currency' => 'RON',
                    'is_paid_online' => true,
                ]);
        }

        $appointments = DB::table('appointments')->orderBy('id')->get();
        foreach ($appointments as $appointment) {
            $type = $appointment->appointment_type_id
                ? DB::table('psychologist_appointment_types')->where('id', $appointment->appointment_type_id)->first()
                : null;
            $totalAmount = (float) ($type->price_amount ?? 0);
            $platformFee = round($totalAmount * 0.15, 2);
            $payoutAmount = round($totalAmount - $platformFee, 2);
            $requestedAt = $appointment->created_at ?? now();

            $status = match ($appointment->status) {
                'scheduled' => 'confirmed',
                default => $appointment->status,
            };

            $paymentStatus = match ($status) {
                'confirmed', 'completed', 'no_show' => $totalAmount > 0 ? 'captured' : 'not_required',
                'cancelled_by_user', 'cancelled_by_psychologist' => $totalAmount > 0 ? 'refunded' : 'not_required',
                default => $totalAmount > 0 ? 'authorized' : 'not_required',
            };

            DB::table('appointments')
                ->where('id', $appointment->id)
                ->update([
                    'status' => $status,
                    'requested_at' => $requestedAt,
                    'confirmed_at' => in_array($status, ['confirmed', 'completed', 'no_show'], true) ? ($appointment->updated_at ?? $requestedAt) : null,
                    'declined_at' => $status === 'declined_by_psychologist' ? ($appointment->updated_at ?? $requestedAt) : null,
                    'cancelled_at' => in_array($status, ['cancelled_by_user', 'cancelled_by_psychologist'], true) ? ($appointment->updated_at ?? $requestedAt) : null,
                    'cancellation_actor_type' => match ($status) {
                        'cancelled_by_user' => 'user',
                        'cancelled_by_psychologist' => 'psychologist',
                        default => null,
                    },
                    'payment_status' => $paymentStatus,
                    'payment_reference' => $totalAmount > 0 ? "legacy-payment-{$appointment->id}" : null,
                    'total_amount' => $totalAmount,
                    'platform_fee_amount' => $platformFee,
                    'psychologist_payout_amount' => $payoutAmount,
                    'currency' => $type->currency ?? 'RON',
                ]);

            DB::table('appointment_status_history')->insert([
                'appointment_id' => $appointment->id,
                'from_status' => null,
                'to_status' => $status,
                'actor_type' => 'migration',
                'actor_id' => null,
                'note' => 'Status initial migrat',
                'meta' => json_encode(['legacy_status' => $appointment->status]),
                'changed_at' => $requestedAt,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($totalAmount > 0) {
                $paymentId = DB::table('payments')->insertGetId([
                    'appointment_id' => $appointment->id,
                    'provider' => 'platform_placeholder',
                    'provider_reference' => "legacy-payment-{$appointment->id}",
                    'status' => $paymentStatus,
                    'amount' => $totalAmount,
                    'platform_fee_amount' => $platformFee,
                    'psychologist_payout_amount' => $payoutAmount,
                    'currency' => $type->currency ?? 'RON',
                    'authorized_at' => $requestedAt,
                    'captured_at' => in_array($paymentStatus, ['captured', 'refunded'], true) ? ($appointment->updated_at ?? $requestedAt) : null,
                    'voided_at' => $paymentStatus === 'voided' ? ($appointment->updated_at ?? $requestedAt) : null,
                    'refunded_at' => $paymentStatus === 'refunded' ? ($appointment->updated_at ?? $requestedAt) : null,
                    'meta' => json_encode(['source' => 'legacy_migration']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                if ($paymentStatus === 'refunded') {
                    DB::table('refunds')->insert([
                        'payment_id' => $paymentId,
                        'appointment_id' => $appointment->id,
                        'amount' => $totalAmount,
                        'currency' => $type->currency ?? 'RON',
                        'status' => 'processed',
                        'reason' => 'Migrated refunded state',
                        'processed_at' => $appointment->updated_at ?? $requestedAt,
                        'meta' => json_encode(['source' => 'legacy_migration']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('appointment_reminder_preferences');
        Schema::dropIfExists('appointment_status_history');

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'requested_at',
                'confirmed_at',
                'declined_at',
                'cancelled_at',
                'expires_at',
                'cancellation_actor_type',
                'cancellation_reason',
                'payment_status',
                'payment_reference',
                'total_amount',
                'platform_fee_amount',
                'psychologist_payout_amount',
                'currency',
            ]);
        });

        Schema::table('psychologist_appointment_types', function (Blueprint $table) {
            $table->dropColumn(['price_amount', 'currency', 'is_paid_online']);
        });
    }
};
