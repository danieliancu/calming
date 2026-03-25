<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssistantMessageController extends Controller
{
    public function __construct(protected AssistantService $assistant)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:'.config('assistant.max_message_chars', 1500)],
            'assistantMode' => ['nullable', 'string', 'in:supportive,clarity,action,checkin'],
        ]);

        return response()->json(
            $this->assistant->respondAsUser($request->user(), $validated['content'], $validated['assistantMode'] ?? null)
        );
    }
}
