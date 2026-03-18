<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'article_id',
        'saved_at',
        'reminder_frequency',
        'next_remind_at',
        'last_notified_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'saved_at' => 'datetime',
            'next_remind_at' => 'datetime',
            'last_notified_at' => 'datetime',
        ];
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
