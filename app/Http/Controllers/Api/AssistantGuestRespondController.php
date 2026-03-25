<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssistantGuestRespondController extends Controller
{
    public function __construct(protected AssistantService $assistant)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guestProfile' => ['array'],
            'guestProfile.focusTopics' => ['array'],
            'guestProfile.focusTopics.*' => ['string', 'max:80'],
            'assistantMode' => ['nullable', 'string', 'in:supportive,clarity,action,checkin'],
            'messages' => ['array'],
            'messages.*.role' => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:'.config('assistant.max_message_chars', 1500)],
            'sessionMessageCount' => ['required', 'integer', 'min:0'],
        ]);

        return response()->json(
            $this->assistant->respondAsGuest(
                $validated['guestProfile'] ?? [],
                $validated['messages'] ?? [],
                (int) $validated['sessionMessageCount'],
                $validated['assistantMode'] ?? null,
            )
        );
    }
}
