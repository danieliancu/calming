<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_DECLINED_BY_PSYCHOLOGIST = 'declined_by_psychologist';
    public const STATUS_CANCELLED_BY_USER = 'cancelled_by_user';
    public const STATUS_CANCELLED_BY_PSYCHOLOGIST = 'cancelled_by_psychologist';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_NO_SHOW = 'no_show';
    public const STATUS_EXPIRED = 'expired';

    public const ACTIVE_BLOCKING_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
    ];

    protected $fillable = [
        'user_id',
        'psychologist_id',
        'appointment_type_id',
        'type',
        'psychologist_name',
        'starts_at',
        'ends_at',
        'scheduled_for',
        'location_mode',
        'status',
        'notes',
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
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'scheduled_for' => 'datetime',
            'requested_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'declined_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'expires_at' => 'datetime',
            'total_amount' => 'decimal:2',
            'platform_fee_amount' => 'decimal:2',
            'psychologist_payout_amount' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function psychologist(): BelongsTo
    {
        return $this->belongsTo(Psychologist::class);
    }

    public function appointmentType(): BelongsTo
    {
        return $this->belongsTo(PsychologistAppointmentType::class, 'appointment_type_id');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(AppointmentStatusHistory::class);
    }

    public function reminderPreferences(): HasMany
    {
        return $this->hasMany(AppointmentReminderPreference::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }
}
