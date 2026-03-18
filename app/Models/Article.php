<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'tag',
        'minutes',
        'hero_image',
        'author',
        'body',
        'is_recommended',
        'topic_id',
    ];

    protected function casts(): array
    {
        return [
            'is_recommended' => 'boolean',
        ];
    }
}
