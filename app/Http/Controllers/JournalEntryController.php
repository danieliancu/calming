<?php

namespace App\Http\Controllers;

use App\Support\MilestoneService;
use App\Support\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalEntryController extends Controller
{
    public function __construct(
        protected NotificationService $notifications,
        protected MilestoneService $milestones,
    ) {
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'mood' => ['required', 'string', 'max:50'],
            'intensity' => ['required', 'integer', 'between:0,10'],
            'symptoms' => ['array'],
            'symptoms.*' => ['string', 'max:100'],
            'context' => ['array'],
            'context.*' => ['string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'redirect_to' => ['nullable', 'string', 'max:255'],
        ]);

        $moodId = DB::table('mood_options')->where('label', $validated['mood'])->value('id');

        abort_unless($moodId, 422, 'Starea selectata nu este valida.');

        DB::transaction(function () use ($request, $validated, $moodId) {
            $entryId = DB::table('journal_entries')->insertGetId([
                'user_id' => $request->user()->id,
                'mood_id' => $moodId,
                'intensity' => $validated['intensity'],
                'notes' => $validated['notes'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($validated['context'] ?? [] as $label) {
                $contextId = DB::table('journal_context_tags')->where('label', $label)->value('id');
                if ($contextId) {
                    DB::table('journal_entry_contexts')->updateOrInsert([
                        'entry_id' => $entryId,
                        'context_id' => $contextId,
                    ]);
                }
            }

            foreach ($validated['symptoms'] ?? [] as $label) {
                $symptomId = DB::table('journal_symptom_tags')->where('label', $label)->value('id');
                if ($symptomId) {
                    DB::table('journal_entry_symptoms')->updateOrInsert([
                        'entry_id' => $entryId,
                        'symptom_id' => $symptomId,
                    ]);
                }
            }

            $this->notifications->publishToUser($request->user()->id, 'journal_saved', [
                'title' => 'Intrare noua in jurnal',
                'body' => 'Am salvat reflectia ta si am actualizat progresul personal.',
                'category' => 'journal',
                'icon' => 'FiHeart',
                'icon_color' => 'mint',
                'trigger_type' => 'journal_entry',
                'trigger_id' => (string) $entryId,
                'dedupe_key' => "journal_saved:{$request->user()->id}:{$entryId}",
                'cta_kind' => 'open',
                'cta_payload' => ['href' => '/journal', 'label' => 'Vezi jurnalul'],
            ]);
        });

        $this->milestones->syncForUser($request->user()->id);

        return redirect($validated['redirect_to'] ?? '/')->with('status', 'Intrarea din jurnal a fost salvata.');
    }
}
