<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\MilestoneService;
use App\Support\NotificationService;
use App\Support\UserProfileBootstrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalEntryApiController extends Controller
{
    public function __construct(
        protected UserProfileBootstrapper $bootstrapper,
        protected NotificationService $notifications,
        protected MilestoneService $milestones,
    ) {
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        $validated = $request->validate([
            'moodId' => ['required', 'integer', 'exists:mood_options,id'],
            'intensity' => ['nullable', 'integer', 'between:0,10'],
            'notes' => ['required', 'string'],
            'symptomIds' => ['array'],
            'symptomIds.*' => ['integer', 'exists:journal_symptom_tags,id'],
            'contextIds' => ['array'],
            'contextIds.*' => ['integer', 'exists:journal_context_tags,id'],
        ]);

        $entryId = DB::transaction(function () use ($request, $validated) {
            $entryId = DB::table('journal_entries')->insertGetId([
                'user_id' => $request->user()->id,
                'mood_id' => $validated['moodId'],
                'intensity' => $validated['intensity'] ?? null,
                'notes' => $validated['notes'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($validated['contextIds'] ?? [] as $contextId) {
                DB::table('journal_entry_contexts')->insert([
                    'entry_id' => $entryId,
                    'context_id' => $contextId,
                ]);
            }

            foreach ($validated['symptomIds'] ?? [] as $symptomId) {
                DB::table('journal_entry_symptoms')->insert([
                    'entry_id' => $entryId,
                    'symptom_id' => $symptomId,
                ]);
            }

            return $entryId;
        });

        $this->bootstrapper->syncStats($request->user()->id);
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
        $this->milestones->syncForUser($request->user()->id);

        return response()->json(['id' => $entryId], 201);
    }

    public function quick(Request $request): JsonResponse
    {
        abort_unless($request->user(), 401, 'Autentificare necesara');

        $validated = $request->validate([
            'moodId' => ['required', 'integer', 'exists:mood_options,id'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $entryId = DB::table('journal_quick_entries')->insertGetId([
            'user_id' => $request->user()->id,
            'mood_id' => $validated['moodId'],
            'notes' => str($validated['notes'] ?? '')->trim()->value() ?: null,
            'created_at' => now(),
        ]);

        $entry = DB::table('journal_quick_entries as qe')
            ->join('mood_options as mo', 'mo.id', '=', 'qe.mood_id')
            ->where('qe.id', $entryId)
            ->select('qe.id', 'qe.notes', 'qe.created_at', 'mo.label as mood_label', 'mo.emoji as mood_emoji')
            ->first();

        $this->bootstrapper->syncStats($request->user()->id);
        $this->notifications->publishToUser($request->user()->id, 'quick_check_in_saved', [
            'title' => 'Check-in salvat',
            'body' => 'Am notat starea ta rapida pentru azi.',
            'category' => 'journal',
            'icon' => 'FiHeart',
            'icon_color' => 'mint',
            'trigger_type' => 'journal_quick_entry',
            'trigger_id' => (string) $entryId,
            'dedupe_key' => "quick_check_in:{$request->user()->id}:{$entryId}",
            'cta_kind' => 'open',
            'cta_payload' => ['href' => '/journal', 'label' => 'Vezi jurnalul'],
        ]);
        $this->milestones->syncForUser($request->user()->id);

        return response()->json(['entry' => $entry], 201);
    }
}
