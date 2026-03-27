<?php

namespace App\Support;

use Illuminate\Support\Collection;

class AssistantPromptBuilder
{
    public function systemPrompt(array $profile, ?array $memory = null, bool $guest = false): string
    {
        $focusTopics = implode(', ', $profile['focus_topics'] ?? []);
        $assistantMode = (string) ($profile['assistant_mode'] ?? 'supportive');
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
            'Foloseste activ setarile si profilul disponibile pentru a adapta tonul, vocabularul, exemplele si nivelul de concretete al raspunsului.',
            'Daca exista interval de varsta, trateaza-l ca informatie relevanta si adapteaza raspunsul la acea etapa de viata, chiar daca nu mentionezi mereu explicit varsta.',
            'Nu ignora setarile de sesiune atunci cand raspunsul poate fi facut mai potrivit cu ele.',
            'Daca utilizatorul intreaba ce varsta are sau ce varsta crezi ca are, iar profilul contine un interval de varsta, raspunzi folosind acel interval in loc sa spui ca nu stii.',
        ];

        foreach ($this->modeInstructions($assistantMode) as $instruction) {
            $parts[] = $instruction;
        }

        if ($guest) {
            $parts[] = 'Utilizatorul este guest, iar setarile lui sunt valabile doar pentru sesiunea curenta.';
        }

        $parts[] = 'Modul selectat al asistentului: '.$this->assistantModeLabel($assistantMode).'.';

        if (! empty($profile['guidance_style_label'])) {
            $parts[] = 'Stil preferat de ghidaj: '.$profile['guidance_style_label'].'.';
        }

        if (! empty($profile['age_range'])) {
            $parts[] = 'Interval de varsta: '.$profile['age_range'].'.';
        }

        if (! empty($profile['display_name'])) {
            $parts[] = 'Numele utilizatorului este: '.$profile['display_name'].'.';
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

    protected function modeInstructions(string $assistantMode): array
    {
        return match ($assistantMode) {
            'clarity' => [
                'Ajuta utilizatorul sa puna ordine in ganduri si sa separe faptele, emotiile si concluziile.',
                'Formuleaza raspunsuri mai limpezi si usor mai analitice, fara sa devii rece.',
                'Daca e util, reflecteaza in 2 pasi simpli ce pare central si ce poate astepta.',
            ],
            'action' => [
                'Fii mai direct si orientat pe pasul urmator concret.',
                'Dupa validarea emotiei, impinge conversatia spre o actiune mica, realizabila azi.',
                'Evita sa ramai prea mult in explorare daca utilizatorul pare blocat.',
            ],
            'checkin' => [
                'Pastreaza un ton foarte bland, scurt si asezat.',
                'Favorizeaza reglarea, observatia de moment si ritmul calm in locul analizelor lungi.',
                'Sugereaza doar pasi foarte mici, linistitori, fara presiune.',
            ],
            default => [
                'Fii cald, empatic si de sustinere emotionala.',
                'Ofera validare si spatiu de descarcare inainte de a orienta conversatia spre clarificare sau actiune.',
            ],
        };
    }

    protected function assistantModeLabel(string $assistantMode): string
    {
        return match ($assistantMode) {
            'clarity' => 'Claritate',
            'action' => 'Plan de actiune',
            'checkin' => 'Check-in bland',
            default => 'De sustinere',
        };
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
