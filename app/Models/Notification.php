<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'recipient_type',
        'user_id',
        'guest_token',
        'template_id',
        'category',
        'title',
        'body',
        'icon',
        'icon_color',
        'priority',
        'status',
        'segment',
        'trigger_type',
        'trigger_id',
        'cta_kind',
        'cta_payload',
        'published_at',
        'read_at',
        'consumed_at',
        'expires_at',
        'dedupe_key',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'cta_payload' => 'array',
            'meta' => 'array',
            'published_at' => 'datetime',
            'read_at' => 'datetime',
            'consumed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(NotificationTemplate::class, 'template_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
