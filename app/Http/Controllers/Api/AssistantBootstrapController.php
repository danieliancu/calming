<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AssistantBootstrapController extends Controller
{
    public function __construct(protected AssistantService $assistant)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        $logData = [
            'user_id' => $user?->id,
            'user_email' => $user?->email,
            'authenticated' => $request->user() !== null,
            'session_id' => session()->getId(),
            'time' => now()->toDateTimeString(),
        ];

        Log::info('AssistantBootstrap called', $logData);

        $response = $this->assistant->bootstrap($user);

        // Additional logging for response
        $logResponse = [
            'guest_mode' => $response['guest_mode'] ?? null,
            'message_count' => count($response['messages'] ?? []),
            'thread_id' => $response['thread']['id'] ?? null,
            'messages_array_keys' => array_key_exists('messages', $response) ? 'present' : 'missing',
            'first_message_preview' => isset($response['messages'][0]) ? substr($response['messages'][0]['content'] ?? '', 0, 100) : 'none',
        ];

        Log::info('AssistantBootstrap response', $logResponse);

        // IMPORTANT: Ensure response structure is correct
        if ($response['guest_mode'] === false && count($response['messages'] ?? []) === 0) {
            Log::warning('AssistantBootstrap: Authenticated user but no messages returned', [
                'user_id' => $user?->id,
                'thread_id' => $response['thread']['id'] ?? null,
            ]);
        }

        return response()->json($response);
    }
}
