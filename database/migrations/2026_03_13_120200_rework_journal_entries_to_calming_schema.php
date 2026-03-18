<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('journal_entries', 'mood_id')) {
            Schema::table('journal_entries', function (Blueprint $table) {
                $table->foreignId('mood_id')->nullable()->after('user_id')->constrained('mood_options');
            });
        }

        if (Schema::hasColumn('journal_entries', 'mood')) {
            DB::table('journal_entries')
                ->select('id', 'mood')
                ->orderBy('id')
                ->each(function ($entry) {
                    $moodId = DB::table('mood_options')->where('label', $entry->mood)->value('id');
                    if ($moodId) {
                        DB::table('journal_entries')->where('id', $entry->id)->update(['mood_id' => $moodId]);
                    }
                });
        }

        Schema::create('journal_entry_contexts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignId('context_id')->constrained('journal_context_tags')->cascadeOnDelete();
            $table->unique(['entry_id', 'context_id']);
        });

        Schema::create('journal_entry_symptoms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignId('symptom_id')->constrained('journal_symptom_tags')->cascadeOnDelete();
            $table->unique(['entry_id', 'symptom_id']);
        });

        if (Schema::hasColumn('journal_entries', 'context')) {
            DB::table('journal_entries')->orderBy('id')->each(function ($entry) {
                $contexts = json_decode($entry->context ?? '[]', true) ?: [];
                foreach ($contexts as $label) {
                    $contextId = DB::table('journal_context_tags')->where('label', $label)->value('id');
                    if ($contextId) {
                        DB::table('journal_entry_contexts')->updateOrInsert([
                            'entry_id' => $entry->id,
                            'context_id' => $contextId,
                        ]);
                    }
                }

                $symptoms = json_decode($entry->symptoms ?? '[]', true) ?: [];
                foreach ($symptoms as $label) {
                    $symptomId = DB::table('journal_symptom_tags')->where('label', $label)->value('id');
                    if ($symptomId) {
                        DB::table('journal_entry_symptoms')->updateOrInsert([
                            'entry_id' => $entry->id,
                            'symptom_id' => $symptomId,
                        ]);
                    }
                }
            });

            Schema::table('journal_entries', function (Blueprint $table) {
                $table->dropColumn(['mood', 'symptoms', 'context']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entry_symptoms');
        Schema::dropIfExists('journal_entry_contexts');
    }
};
