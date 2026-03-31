<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedArticle;
use App\Support\MilestoneService;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleSaveController extends Controller
{
    public function __construct(
        protected NotificationService $notifications,
        protected MilestoneService $milestones,
    ) {
    }

    public function store(Request $request, int $articleId): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        SavedArticle::query()->updateOrCreate(
            ['user_id' => $request->user()->id, 'article_id' => $articleId],
            ['saved_at' => now(), 'status' => 'active']
        );

        $this->notifications->publishToUser($request->user()->id, 'article_saved', [
            'title' => 'Articol salvat',
            'body' => 'Articolul a fost salvat și îl poți regăsi rapid în centrul de notificări.',
            'category' => 'article',
            'icon' => 'FiBookmark',
            'icon_color' => 'lilac',
            'trigger_type' => 'saved_article',
            'trigger_id' => (string) $articleId,
            'dedupe_key' => "saved_article:{$request->user()->id}:{$articleId}",
            'cta_kind' => 'open',
            'cta_payload' => ['href' => '/notifications', 'label' => 'Vezi notificările'],
        ]);
        $this->milestones->syncForUser($request->user()->id);

        return response()->json(['saved' => true]);
    }

    public function destroy(Request $request, int $articleId): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        SavedArticle::query()
            ->where('user_id', $request->user()->id)
            ->where('article_id', $articleId)
            ->delete();

        return response()->json(['saved' => false]);
    }
}
