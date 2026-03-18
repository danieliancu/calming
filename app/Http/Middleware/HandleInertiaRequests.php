<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $psychologistMfaAt = $request->session()->get('psychologist_mfa_confirmed_at');
        $superadminId = (int) $request->session()->get('superadmin_id');
        $psychologist = Auth::guard('psychologist')->user();
        $superadmin = null;

        if ($psychologist && (! $psychologistMfaAt || now()->diffInHours($psychologistMfaAt) >= 12)) {
            Auth::guard('psychologist')->logout();
            $request->session()->forget([
                'psychologist_mfa_confirmed_at',
                'pending_psychologist_id',
                'pending_psychologist_mfa_purpose',
                'pending_psychologist_intended_url',
            ]);
            $psychologist = null;
        }

        if ($superadminId > 0) {
            $superadmin = DB::table('superadmins')
                ->where('id', $superadminId)
                ->first(['id', 'username']);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'psychAuth' => [
                'user' => $psychologist ? [
                    'id' => $psychologist->id,
                    'name' => trim(implode(' ', array_filter([$psychologist->title, $psychologist->name, $psychologist->surname]))),
                    'first_name' => $psychologist->name,
                ] : null,
            ],
            'superAuth' => [
                'user' => $superadmin ? [
                    'id' => $superadmin->id,
                    'username' => $superadmin->username,
                ] : null,
            ],
            'preferences' => [
                'theme' => $request->user()?->theme ?? $request->session()->get('theme', 'light'),
                'notifications_enabled' => $request->user()?->notifications_enabled ?? $request->session()->get('notifications_enabled', true),
                'language' => $request->user()?->language ?? $request->session()->get('language', 'Romana'),
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
