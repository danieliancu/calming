<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentReminderPreference extends Model
{
    protected $fillable = [
        'appointment_id',
        'actor_type',
        'user_id',
        'psychologist_id',
        'minutes_before',
        'email_enabled',
        'last_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'minutes_before' => 'integer',
            'email_enabled' => 'boolean',
            'last_sent_at' => 'datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function psychologist(): BelongsTo
    {
        return $this->belongsTo(Psychologist::class);
    }
}
