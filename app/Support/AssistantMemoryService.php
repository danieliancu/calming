<?php

namespace App\Support;

use App\Models\AssistantMemory;
use App\Models\AssistantThread;
use Illuminate\Support\Str;

class AssistantMemoryService
{
    public function refreshForThread(AssistantThread $thread, array $profile): ?AssistantMemory
    {
        if (! $thread->user_id) {
            return null;
        }

        $memory = AssistantMemory::query()->firstOrCreate(
            ['user_id' => $thread->user_id],
            [
                'memory_summary' => null,
                'structured_memory' => [],
            ]
        );

        $lastMessageId = $memory->last_summarized_message_id ?? 0;
        $unsummarizedCount = $thread->messages()
            ->where('id', '>', $lastMessageId)
            ->whereIn('role', ['user', 'assistant'])
            ->count();

        if ($unsummarizedCount < max(1, (int) config('assistant.summarize_every', 8))) {
            return $memory;
        }

        $recentUserMessages = $thread->messages()
            ->where('id', '>', $lastMessageId)
            ->where('role', 'user')
            ->latest('id')
            ->limit(4)
            ->get()
            ->reverse()
            ->pluck('content')
            ->filter()
            ->map(fn (string $text) => Str::limit(trim(preg_replace('/\s+/', ' ', $text)), 180))
            ->values()
            ->all();

        $highlights = [];
        if (! empty($profile['focus_topics'])) {
            $highlights[] = 'Arii urmarite: '.implode(', ', array_slice($profile['focus_topics'], 0, 5));
        }
        if (! empty($profile['primary_goal'])) {
            $highlights[] = 'Obiectiv principal: '.Str::limit($profile['primary_goal'], 180);
        }
        if (! empty($profile['coping_strategies'])) {
            $highlights[] = 'Resurse deja utile: '.Str::limit($profile['coping_strategies'], 180);
        }
        if ($recentUserMessages !== []) {
            $highlights[] = 'Teme recente: '.implode(' | ', $recentUserMessages);
        }

        $summary = Str::limit(trim(implode('. ', array_filter($highlights))), 1000);

        $memory->update([
            'memory_summary' => $summary !== '' ? $summary : $memory->memory_summary,
            'structured_memory' => [
                'focus_topics' => $profile['focus_topics'] ?? [],
                'guidance_style' => $profile['guidance_style'] ?? null,
                'primary_goal' => $profile['primary_goal'] ?? null,
                'stress_triggers' => $profile['stress_triggers'] ?? null,
                'coping_strategies' => $profile['coping_strategies'] ?? null,
                'therapy_status' => $profile['therapy_status'] ?? null,
                'recent_user_highlights' => $recentUserMessages,
            ],
            'last_summarized_message_id' => $thread->messages()->max('id'),
        ]);

        return $memory->fresh();
    }
}
