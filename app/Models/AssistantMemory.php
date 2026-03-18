<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssistantMemory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'memory_summary',
        'structured_memory',
        'last_summarized_message_id',
    ];

    protected function casts(): array
    {
        return [
            'structured_memory' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lastSummarizedMessage(): BelongsTo
    {
        return $this->belongsTo(AssistantMessage::class, 'last_summarized_message_id');
    }
}
