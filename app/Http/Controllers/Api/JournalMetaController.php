<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class JournalMetaController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $moods = DB::table('mood_options')->select('id', 'label', 'emoji')->orderBy('id')->get();
        $symptoms = DB::table('journal_symptom_tags')->select('id', 'label')->orderBy('label')->get();
        $contexts = DB::table('journal_context_tags')->select('id', 'label')->orderBy('label')->get();
        $rows = DB::table('mood_symptom_links as msl')
            ->join('journal_symptom_tags as tag', 'tag.id', '=', 'msl.symptom_id')
            ->select('msl.mood_id', 'tag.id as symptom_id', 'tag.label')
            ->orderBy('msl.mood_id')
            ->orderBy('tag.label')
            ->get();

        $moodSymptoms = [];
        foreach ($rows as $row) {
            $moodSymptoms[$row->mood_id] ??= [];
            $moodSymptoms[$row->mood_id][] = [
                'id' => $row->symptom_id,
                'label' => $row->label,
            ];
        }

        return response()->json([
            'moods' => $moods,
            'symptoms' => $symptoms,
            'contexts' => $contexts,
            'moodSymptoms' => $moodSymptoms,
        ]);
    }
}
