<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssistantHistoryController extends Controller
{
    public function __construct(protected AssistantService $assistant)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        return response()->json([
            'messages' => $this->assistant->history(
                $request->user(),
                min(100, max(1, (int) $request->integer('limit', 40)))
            ),
        ]);
    }
}
