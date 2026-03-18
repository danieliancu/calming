<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PsychologistAvailabilityException extends Model
{
    use HasFactory;

    protected $fillable = [
        'psychologist_id',
        'date',
        'is_available',
        'start_time',
        'end_time',
        'interval_minutes',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_available' => 'boolean',
            'interval_minutes' => 'integer',
        ];
    }

    public function psychologist(): BelongsTo
    {
        return $this->belongsTo(Psychologist::class);
    }
}
