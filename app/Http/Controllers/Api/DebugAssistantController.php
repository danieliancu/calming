<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DebugAssistantController
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        $info = [
            'authenticated' => $user !== null,
            'user_id' => $user?->id,
            'session_id' => session()->getId(),
            'tables_exist' => [
                'sessions' => Schema::hasTable('sessions'),
                'assistant_threads' => Schema::hasTable('assistant_threads'),
                'assistant_messages' => Schema::hasTable('assistant_messages'),
                'assistant_memories' => Schema::hasTable('assistant_memories'),
            ],
            'session_data' => [
                'all_data' => session()->all(),
            ],
            'user_threads' => $user ? DB::table('assistant_threads')->where('user_id', $user->id)->get() : [],
            'db_sessions' => DB::table('sessions')->where('user_id', $user?->id)->count() ?? 0,
        ];

        return response()->json($info);
    }
}
