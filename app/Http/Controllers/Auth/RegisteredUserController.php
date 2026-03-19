<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\UserProfileBootstrapper;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(protected UserProfileBootstrapper $bootstrapper)
    {
    }
    /**
     * Display the registration view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/Register', [
            'redirectTo' => $this->sanitizeRedirectPath($request->query('redirectTo')),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $redirectTo = $this->sanitizeRedirectPath($request->input('redirect_to'));

        $request->validate([
            'name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:80',
            'last_name' => 'nullable|string|max:80',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'first_name' => $request->first_name ?: str($request->name)->before(' ')->toString(),
            'last_name' => $request->last_name ?: str($request->name)->after(' ')->trim()->toString(),
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        $this->bootstrapper->ensureForUser($user);

        Auth::login($user);

        if ($redirectTo) {
            return redirect()->to($redirectTo);
        }

        return redirect(route('dashboard', absolute: false));
    }

    protected function sanitizeRedirectPath(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '' || ! str_starts_with($value, '/') || str_starts_with($value, '//')) {
            return null;
        }

        return $value;
    }
}
