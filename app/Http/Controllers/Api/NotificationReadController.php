<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationReadController extends Controller
{
    public function __construct(protected NotificationService $notifications)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notificationId' => ['required', 'integer'],
        ]);

        $this->notifications->markRead($validated['notificationId'], $request->user()?->id);

        return response()->json(['ok' => true]);
    }
}
