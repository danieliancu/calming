<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\SavedArticle;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleReminderController extends Controller
{
    public function __construct(protected NotificationService $notifications)
    {
    }

    public function store(Request $request, int $articleId): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        $validated = $request->validate([
            'frequency' => ['nullable', 'string', 'max:40'],
        ]);

        $saved = SavedArticle::query()->updateOrCreate(
            ['user_id' => $request->user()->id, 'article_id' => $articleId],
            [
                'saved_at' => now(),
                'status' => 'active',
                'reminder_frequency' => $validated['frequency'] ?? 'monthly',
                'next_remind_at' => now()->addMonth(),
            ]
        );
        $articleSlug = Article::query()->where('id', $articleId)->value('slug');

        $this->notifications->publishToUser($request->user()->id, 'article_reminder_set', [
            'title' => 'Reminder pentru articol',
            'body' => 'Ti-am pregatit un reminder pentru a reveni la acest articol.',
            'category' => 'reminder',
            'icon' => 'FiCalendar',
            'icon_color' => 'rose',
            'trigger_type' => 'article_reminder',
            'trigger_id' => (string) $articleId,
            'dedupe_key' => "article_reminder:{$request->user()->id}:{$articleId}",
            'cta_kind' => 'open',
            'cta_payload' => ['href' => $articleSlug ? '/article/'.$articleSlug : '/learn', 'label' => 'Deschide articolul', 'article_id' => $articleId, 'frequency' => $saved->reminder_frequency],
        ]);

        return response()->json([
            'reminder' => true,
            'frequency' => $saved->reminder_frequency,
        ]);
    }

    public function destroy(Request $request, int $articleId): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        SavedArticle::query()
            ->where('user_id', $request->user()->id)
            ->where('article_id', $articleId)
            ->update([
                'reminder_frequency' => null,
                'next_remind_at' => null,
            ]);

        return response()->json(['reminder' => false]);
    }
}
