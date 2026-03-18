<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationReadAllController extends Controller
{
    public function __construct(protected NotificationService $notifications)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        $this->notifications->markAllReadForUser($request->user()->id);

        return response()->json(['ok' => true]);
    }
}
