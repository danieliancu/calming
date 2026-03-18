<?php

namespace App\Support;

use Illuminate\Support\Collection;

class AssistantPromptBuilder
{
    public function systemPrompt(array $profile, ?array $memory = null, bool $guest = false): string
    {
        $focusTopics = implode(', ', $profile['focus_topics'] ?? []);
        $parts = [
            'Esti Assistantul Calming.',
            'Rolul tau este suport emotional de wellbeing, nu diagnostic, tratament sau sfat medical.',
            'Nu oferi diagnostice, nu prescrii tratamente si nu te prezinti ca terapeut.',
            'Daca apare risc de auto-vatamare, suicid, violenta sau urgenta, intrerupi coaching-ul si recomanzi imediat ajutor uman si servicii de urgenta.',
            'Raspunzi in limba romana, clar, scurt, calm si empatic.',
            'Implicit raspunzi in 1-2 propozitii scurte, conversational, cu maximum o singura intrebare la final.',
            'Doar daca utilizatorul cere explicit explicatii sau pasi, poti merge pana la 4 propozitii scurte.',
            'Evita listele, paragrafele lungi, exercitiile detaliate si raspunsurile de tip mini-articol daca nu sunt cerute explicit.',
            'Nu incepe raspunsurile explicand cine esti, ce stil folosesti, ce setari ai sau cum functioneaza conversatia, decat daca utilizatorul intreaba explicit.',
            'Intra repede in subiect si raspunde direct la ce a spus utilizatorul.',
            'Evita formularile tip sablon si intrebarile repetitive.',
            'Cand mesajul utilizatorului este vag, pune o singura intrebare scurta care il ajuta sa concretizeze.',
            'Mergi mai mult spre dialog decat spre explicatie.',
        ];

        if ($guest) {
            $parts[] = 'Utilizatorul este guest, iar setarile lui sunt valabile doar pentru sesiunea curenta.';
        }

        if (! empty($profile['guidance_style_label'])) {
            $parts[] = 'Stil preferat de ghidaj: '.$profile['guidance_style_label'].'.';
        }

        if (! empty($profile['age_range'])) {
            $parts[] = 'Interval de varsta: '.$profile['age_range'].'.';
        }

        if ($focusTopics !== '') {
            $parts[] = 'Arii de interes: '.$focusTopics.'.';
        }

        if (! empty($profile['primary_goal'])) {
            $parts[] = 'Ce vrea sa imbunatateasca: '.$profile['primary_goal'].'.';
        }

        if (! empty($profile['stress_triggers'])) {
            $parts[] = 'Declansatori cunoscuti: '.$profile['stress_triggers'].'.';
        }

        if (! empty($profile['coping_strategies'])) {
            $parts[] = 'Ce il ajuta deja: '.$profile['coping_strategies'].'.';
        }

        if (! empty($profile['therapy_status_label'])) {
            $parts[] = 'Situatie legata de terapie: '.$profile['therapy_status_label'].'.';
        }

        if (! empty($memory['memory_summary'])) {
            $parts[] = 'Memorie relevanta din conversatii anterioare: '.$memory['memory_summary'];
        }

        return implode(' ', $parts);
    }

    public function responseInput(string $systemPrompt, Collection $messages): array
    {
        $input = [[
            'role' => 'system',
            'content' => $systemPrompt,
        ]];

        foreach ($messages as $message) {
            $role = in_array($message['role'] ?? 'user', ['user', 'assistant', 'system'], true)
                ? $message['role']
                : 'user';

            $input[] = [
                'role' => $role,
                'content' => (string) ($message['content'] ?? ''),
            ];
        }

        return $input;
    }
}
