<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AssistantService;
use App\Support\NotificationDigestService;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationBootstrapController extends Controller
{
    public function __construct(
        protected NotificationService $notifications,
        protected NotificationDigestService $digest,
        protected AssistantService $assistant,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $notificationsEnabled = $request->user()
            ? (bool) ($request->user()->notifications_enabled ?? true)
            : (bool) $request->session()->get('notifications_enabled', true);

        if (! $notificationsEnabled) {
            return response()->json([
                'publicNotifications' => [],
                'unreadCount' => 0,
            ]);
        }

        if ($request->user()) {
            $this->assistant->syncNotificationsForUser($request->user());
        }
        $public = $this->notifications->serializeFeed($this->notifications->feedFor(), []);

        return response()->json([
            'publicNotifications' => array_values(array_merge($public, $this->digest->defaultGuestNotifications())),
            'unreadCount' => $this->notifications->unreadCountFor($userId),
        ]);
    }
}
