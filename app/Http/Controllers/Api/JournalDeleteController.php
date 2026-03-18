<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalDeleteController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        $validated = $request->validate([
            'entryId' => ['required', 'integer'],
            'type' => ['required', 'in:quick,full'],
        ]);

        if ($validated['type'] === 'quick') {
            DB::table('journal_quick_entries')
                ->where('id', $validated['entryId'])
                ->where('user_id', $request->user()->id)
                ->delete();
        } else {
            DB::table('journal_entries')
                ->where('id', $validated['entryId'])
                ->where('user_id', $request->user()->id)
                ->delete();
        }

        return response()->json(['success' => true]);
    }
}
