<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssistantThread extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'last_activity_at',
        'summary_text',
        'profile_snapshot',
        'message_count',
    ];

    protected function casts(): array
    {
        return [
            'last_activity_at' => 'datetime',
            'profile_snapshot' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AssistantMessage::class, 'thread_id');
    }
}
