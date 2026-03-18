<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'key',
        'audience',
        'actor_type',
        'category',
        'title',
        'message',
        'default_title',
        'default_body',
        'icon',
        'icon_color',
        'accent',
        'priority',
        'cta_kind',
        'cta_label',
        'deep_link',
        'is_repeatable',
        'is_active',
        'published_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'is_repeatable' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
