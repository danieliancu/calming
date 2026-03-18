<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthStatusController extends Controller
{
    public function __construct(protected NotificationService $notifications)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $generalCount = $this->notifications->unreadCountFor(null);

            if (! $user) {
                return response()->json([
                    'userId' => null,
                    'initials' => null,
                    'name' => null,
                    'newNotifications' => $generalCount,
                ]);
            }

            $profile = DB::table('user_profiles')->where('user_id', $user->id)->first();

            return response()->json([
                'userId' => $user->id,
                'initials' => $profile->avatar_initials ?? null,
                'name' => $profile->display_name ?? $user->name,
                'firstName' => $user->first_name ?: str($user->name)->before(' ')->toString(),
                'newNotifications' => $this->notifications->unreadCountFor($user->id),
            ]);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'userId' => $user?->id,
                'initials' => null,
                'name' => $user?->name,
                'firstName' => $user?->first_name,
                'newNotifications' => 0,
            ]);
        }
    }
}
