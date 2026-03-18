<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'theme' => ['required', 'in:light,dark'],
            'notifications_enabled' => ['required', 'boolean'],
            'language' => ['required', 'string', 'max:50'],
        ]);

        if ($request->user()) {
            $request->user()->forceFill($validated)->save();
        }

        $request->session()->put('theme', $validated['theme']);
        $request->session()->put('notifications_enabled', $validated['notifications_enabled']);
        $request->session()->put('language', $validated['language']);

        return back()->with('status', 'Preferintele au fost actualizate.');
    }
}
