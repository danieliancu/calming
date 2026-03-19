<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PsychologistAppointmentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'psychologist_id',
        'label',
        'duration_minutes',
        'price_amount',
        'currency',
        'is_paid_online',
        'location_mode',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
            'price_amount' => 'decimal:2',
            'is_paid_online' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function psychologist(): BelongsTo
    {
        return $this->belongsTo(Psychologist::class);
    }
}
