<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    protected $fillable = [
        'appointment_id',
        'provider',
        'provider_reference',
        'status',
        'amount',
        'platform_fee_amount',
        'psychologist_payout_amount',
        'currency',
        'authorized_at',
        'captured_at',
        'voided_at',
        'refunded_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'platform_fee_amount' => 'decimal:2',
            'psychologist_payout_amount' => 'decimal:2',
            'authorized_at' => 'datetime',
            'captured_at' => 'datetime',
            'voided_at' => 'datetime',
            'refunded_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }
}
