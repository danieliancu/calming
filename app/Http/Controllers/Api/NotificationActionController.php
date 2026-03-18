<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedArticle;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationActionController extends Controller
{
    public function __construct(protected NotificationService $notifications)
    {
    }

    public function __invoke(Request $request, int $notificationId): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:open,save,snooze,disable,unread'],
            'articleId' => ['nullable', 'integer'],
            'frequency' => ['nullable', 'string', 'max:40'],
        ]);

        if ($validated['action'] === 'unread') {
            $this->notifications->markUnread($notificationId, $request->user()?->id);

            return response()->json(['ok' => true]);
        }

        $this->notifications->markRead($notificationId, $request->user()?->id);

        if ($validated['action'] === 'save') {
            abort_unless($request->user(), 401, 'Autentificare necesara');
            abort_unless(! empty($validated['articleId']), 422, 'Lipseste articolul.');

            SavedArticle::query()->updateOrCreate(
                ['user_id' => $request->user()->id, 'article_id' => $validated['articleId']],
                ['saved_at' => now(), 'status' => 'active']
            );
        }

        if ($validated['action'] === 'snooze') {
            abort_unless($request->user(), 401, 'Autentificare necesara');

            $notification = $request->user()->notifications()->findOrFail($notificationId);
            $notification->update([
                'expires_at' => now()->addHours(6),
                'status' => 'archived',
            ]);
        }

        return response()->json(['ok' => true]);
    }
}
