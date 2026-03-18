<?php

return [
    'profile_demo' => [
        'name' => 'Sarah Mitchell',
        'email' => 'sarah.mitchell@example.com',
        'member_since' => 'septembrie 2025',
        'profile_completion' => 85,
        'stats' => [
            ['label' => 'Intrari in jurnal', 'value' => '45', 'icon' => 'activity', 'tone' => 'rose'],
            ['label' => 'Zile bune', 'value' => '28/30', 'icon' => 'heart', 'tone' => 'teal'],
            ['label' => 'Nivel mediu stres', 'value' => '2.3/10', 'icon' => 'trend', 'tone' => 'amber'],
            ['label' => 'Zile active', 'value' => '87', 'icon' => 'calendar', 'tone' => 'indigo'],
        ],
        'milestones' => [
            [
                'title' => 'Serie de 30 de zile',
                'description' => 'Ai inregistrat starea de spirit 30 de zile la rand.',
                'date' => '15 octombrie 2025',
            ],
            [
                'title' => 'Prima evaluare emotionala',
                'description' => 'Ai finalizat prima reflectie lunara asupra emotiilor.',
                'date' => '20 septembrie 2025',
            ],
            [
                'title' => 'Membru al comunitatii',
                'description' => 'Te-ai alaturat primului grup de sprijin.',
                'date' => '1 septembrie 2025',
            ],
        ],
        'resources' => [
            'Despre tine',
            'Istoric emotional',
            'Sesiuni programate',
            'Tratament in curs',
        ],
    ],
    'community_groups' => [
        ['name' => 'Cercul zilnic de sprijin', 'members' => 234, 'last' => '2m'],
        ['name' => 'Mindfulness si autoingrijire', 'members' => 189, 'last' => '1h'],
        ['name' => 'Gestionarea stresului', 'members' => 156, 'last' => '15m'],
    ],
    'psychologists' => [
        [
            'name' => 'Dr. Andreea Ionescu',
            'specialty' => 'Psihoterapie cognitiv-comportamentala',
            'rating' => 5,
            'distance' => '2.3 km',
        ],
        [
            'name' => 'Mihai Popescu',
            'specialty' => 'Psiholog clinician',
            'rating' => 5,
            'distance' => '3.1 km',
        ],
        [
            'name' => 'Ioana Radu',
            'specialty' => 'Consiliere anxietate si stres',
            'rating' => 5,
            'distance' => '3.8 km',
        ],
    ],
    'articles' => [
        [
            'tag' => 'Wellness',
            'slug' => 'exercitii-de-respiratie-pentru-calm',
            'title' => 'Exercitii de respiratie pentru calm',
            'minutes' => 5,
            'image' => '/images/calm-breathing.svg',
            'author' => 'Dr Sarah Mitchell',
            'author_role' => 'Specialist Psihologie',
            'summary' => 'Invata o secventa simpla de respiratie pentru a reduce tensiunea si a-ti regla ritmul emotional.',
            'body' => [
                'O rutina scurta de respiratie constienta poate reduce activarea fiziologica si te poate ajuta sa recapeti controlul in momentele aglomerate.',
                'Foloseste exercitiul in trei pasi de mai jos atunci cand simti agitatie, dificultati de concentrare sau nevoia unei pauze rapide.',
            ],
            'steps' => [
                'Inspira pe nas numarand pana la 4.',
                'Tine respiratia pana la 7.',
                'Expira lent pe gura numarand pana la 8.',
            ],
            'alert' => 'Majoritatea schimbarilor de ritm emotional sunt normale, dar daca simptomele persista, cauta sprijin de specialitate.',
        ],
        [
            'tag' => 'Mindfulness',
            'slug' => 'cum-sa-incepi-un-jurnal-al-emotiilor',
            'title' => 'Cum sa incepi un jurnal al emotiilor',
            'minutes' => 7,
            'image' => '/images/mindful-journal.svg',
            'author' => 'Ana Stoica',
            'author_role' => 'Consilier wellbeing',
            'summary' => 'Un jurnal simplu te ajuta sa observi tipare, declansatori si mici progrese zilnice.',
            'body' => [
                'Noteaza pe scurt cum te simti, ce a influentat starea ta si ce ai nevoie in momentul respectiv.',
                'Nu urmari formularea perfecta; consistenta si claritatea sunt mai utile decat textele lungi.',
            ],
            'steps' => [
                'Alege un moment fix al zilei.',
                'Descrie emotia principala si intensitatea ei.',
                'Adauga un context si o actiune mica pentru ziua urmatoare.',
            ],
            'alert' => 'Daca jurnalul scoate la suprafata stari coplesitoare, opreste-te si discuta cu un specialist.',
        ],
        [
            'tag' => 'Somn',
            'slug' => 'rutina-de-seara-in-4-pasi',
            'title' => 'Rutina de seara in 4 pasi',
            'minutes' => 4,
            'image' => '/images/night-routine.svg',
            'author' => 'Irina Pavel',
            'author_role' => 'Psiholog clinician',
            'summary' => 'Patru pasi scurti pentru a inchide ziua cu mai multa liniste si predictibilitate.',
            'body' => [
                'Rutinele repetabile reduc oboseala decizionala si trimit corpului un semnal clar ca urmeaza odihna.',
                'Pastreaza ritualul simplu si realist pentru a-l putea repeta in majoritatea serilor.',
            ],
            'steps' => [
                'Redu stimulii digitali cu 30 de minute inainte de somn.',
                'Pregateste camera pentru liniste si temperatura confortabila.',
                'Alege un exercitiu scurt de respiratie sau stretching.',
                'Noteaza un gand de incheiere a zilei.',
            ],
            'alert' => 'Daca problemele de somn se prelungesc, merita o evaluare profesionala.',
        ],
    ],
    'notifications' => [
        'today' => [
            [
                'title' => 'Reminder autoexaminare',
                'message' => 'Este momentul pentru autoexaminarea lunara.',
                'time' => 'Acum 2 ore',
                'tag' => 'Nou',
                'icon' => 'calendar',
                'accent' => 'rose',
            ],
            [
                'title' => 'Asistent AI',
                'message' => 'Am pregatit recomandari personalizate pentru tine.',
                'time' => 'Acum 5 ore',
                'tag' => 'Nou',
                'icon' => 'message',
                'accent' => 'violet',
            ],
        ],
        'earlier' => [
            [
                'title' => 'Actualizare comunitate',
                'message' => 'Postare noua in Cercul zilnic de sprijin.',
                'time' => 'Ieri',
                'icon' => 'users',
                'accent' => 'mint',
            ],
            [
                'title' => 'Articol nou',
                'message' => 'Intelege mai bine cum poti gestiona starile dificile.',
                'time' => 'Acum 2 zile',
                'icon' => 'book',
                'accent' => 'amber',
            ],
            [
                'title' => 'Reminder programare',
                'message' => 'Sedinta ta este programata pe 25 octombrie la ora 10:00.',
                'time' => 'Acum 3 zile',
                'icon' => 'clock',
                'accent' => 'peach',
            ],
            [
                'title' => 'Verificare zilnica',
                'message' => 'Cum te simti astazi? Ia un moment sa notezi in jurnal.',
                'time' => 'Acum 1 saptamana',
                'icon' => 'heart',
                'accent' => 'lilac',
            ],
        ],
    ],
];
