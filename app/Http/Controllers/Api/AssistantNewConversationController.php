<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssistantNewConversationController extends Controller
{
    public function __construct(protected AssistantService $assistant)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        return response()->json(
            $this->assistant->startNewConversation($request->user())
        );
    }
}
