<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PsychologistAvailabilityRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'psychologist_id',
        'weekday',
        'start_time',
        'end_time',
        'interval_minutes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
            'interval_minutes' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function psychologist(): BelongsTo
    {
        return $this->belongsTo(Psychologist::class);
    }
}
