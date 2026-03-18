<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Psychologist extends Authenticatable
{
    use Notifiable;

    protected $table = 'psychologists';

    protected $guard = 'psychologist';

    public $timestamps = false;

    protected $fillable = [
        'title',
        'name',
        'surname',
        'slug',
        'email',
        'password_hash',
        'phone',
        'supports_online',
        'email_verified_at',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'supports_online' => 'boolean',
        ];
    }

    public function getAuthPassword(): string
    {
        return (string) $this->password_hash;
    }

    public function appointmentTypes(): HasMany
    {
        return $this->hasMany(PsychologistAppointmentType::class);
    }

    public function availabilityRules(): HasMany
    {
        return $this->hasMany(PsychologistAvailabilityRule::class);
    }

    public function availabilityExceptions(): HasMany
    {
        return $this->hasMany(PsychologistAvailabilityException::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
