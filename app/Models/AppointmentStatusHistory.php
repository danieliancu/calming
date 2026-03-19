<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentStatusHistory extends Model
{
    protected $table = 'appointment_status_history';

    protected $fillable = [
        'appointment_id',
        'from_status',
        'to_status',
        'actor_type',
        'actor_id',
        'note',
        'meta',
        'changed_at',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'changed_at' => 'datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
