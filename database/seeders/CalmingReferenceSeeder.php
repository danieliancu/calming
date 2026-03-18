<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CalmingReferenceSeeder extends Seeder
{
    public function run(): void
    {
        $moods = [
            ['label' => 'Minunat', 'emoji' => '😊'],
            ['label' => 'Bine', 'emoji' => '🙂'],
            ['label' => 'In regula', 'emoji' => '😌'],
            ['label' => 'Obosit', 'emoji' => '😴'],
            ['label' => 'Suparat', 'emoji' => '😞'],
            ['label' => 'Dezamagit', 'emoji' => '😕'],
            ['label' => 'Greu', 'emoji' => '😔'],
        ];

        foreach ($moods as $mood) {
            DB::table('mood_options')->updateOrInsert(['label' => $mood['label']], $mood);
        }

        $contexts = ['Munca', 'Familie', 'Financiar', 'Sanatate', 'Somn insuficient', 'Eveniment social', 'Studii', 'Activitate fizica', 'Calatorie'];
        foreach ($contexts as $label) {
            DB::table('journal_context_tags')->updateOrInsert(['label' => $label], ['label' => $label]);
        }

        $symptoms = [
            'Anxietate', 'Atac de panica', 'Tristete', 'Iritabilitate', 'Oboseala', 'Probleme de somn',
            'Ganduri intruzive', 'Dificultati de concentrare', 'Lipsa de energie', 'Retragere sociala',
            'Energie ridicata', 'Recunostinta', 'Calm interior', 'Motivatie', 'Conectat cu ceilalti',
            'Optimism', 'Neutralitate', 'Atentie', 'Focalizare',
        ];

        foreach ($symptoms as $label) {
            DB::table('journal_symptom_tags')->updateOrInsert(['label' => $label], ['label' => $label]);
        }

        $moodLinks = [
            'Minunat' => ['Energie ridicata', 'Recunostinta', 'Calm interior', 'Motivatie', 'Conectat cu ceilalti', 'Optimism'],
            'Bine' => ['Motivatie', 'Conectat cu ceilalti', 'Optimism', 'Recunostinta', 'Atentie', 'Calm interior'],
            'In regula' => ['Neutralitate', 'Focalizare', 'Atentie', 'Calm interior', 'Motivatie', 'Optimism'],
            'Obosit' => ['Oboseala', 'Probleme de somn', 'Lipsa de energie', 'Dificultati de concentrare', 'Tristete', 'Anxietate'],
            'Suparat' => ['Tristete', 'Iritabilitate', 'Retragere sociala', 'Anxietate', 'Ganduri intruzive', 'Probleme de somn'],
            'Dezamagit' => ['Tristete', 'Lipsa de energie', 'Ganduri intruzive', 'Retragere sociala', 'Anxietate', 'Dificultati de concentrare'],
            'Greu' => ['Atac de panica', 'Ganduri intruzive', 'Anxietate', 'Dificultati de concentrare', 'Lipsa de energie', 'Probleme de somn'],
        ];

        foreach ($moodLinks as $moodLabel => $labels) {
            $moodId = DB::table('mood_options')->where('label', $moodLabel)->value('id');
            foreach ($labels as $symptomLabel) {
                $symptomId = DB::table('journal_symptom_tags')->where('label', $symptomLabel)->value('id');
                if ($moodId && $symptomId) {
                    DB::table('mood_symptom_links')->updateOrInsert([
                        'mood_id' => $moodId,
                        'symptom_id' => $symptomId,
                    ], [
                        'mood_id' => $moodId,
                        'symptom_id' => $symptomId,
                    ]);
                }
            }
        }

        $faqRows = [
            ['question' => 'Cum incepe o conversatie cu Asistentul AI?', 'answer' => 'Deschide Asistentul si scrie intrebarea sau subiectul tau. Asistentul este disponibil permanent.'],
            ['question' => 'Cum adaug o intrare de jurnal?', 'answer' => 'De pe orice pagina apasa Jurnalul tau sau deschide meniul jurnalului; se deschide o fereastra unde poti completa starea, contextul si notele.'],
            ['question' => 'Pot deschide jurnalul din alte pagini?', 'answer' => 'Da. Jurnalul se deschide ca modal peste orice pagina. Il poti inchide din X sau cu tasta Esc, revenind exact unde erai.'],
            ['question' => 'Se salveaza datele jurnalului?', 'answer' => 'Da. In aceasta versiune, datele sunt persistate pe server pentru utilizatorii conectati.'],
        ];

        foreach ($faqRows as $row) {
            DB::table('faqs')->updateOrInsert(['question' => $row['question']], $row);
        }

        $templates = [
            ['template_key' => 'streak_3', 'rule_key' => 'streak_3', 'title' => '3 zile la rand', 'description' => 'Ai revenit 3 zile consecutiv in jurnal.', 'category' => 'consistency', 'icon' => 'FiAward', 'icon_color' => 'rose', 'sort_order' => 10],
            ['template_key' => 'streak_7', 'rule_key' => 'streak_7', 'title' => '7 zile la rand', 'description' => 'Ai mentinut ritmul timp de o saptamana.', 'category' => 'consistency', 'icon' => 'FiAward', 'icon_color' => 'rose', 'sort_order' => 20],
            ['template_key' => 'streak_14', 'rule_key' => 'streak_14', 'title' => '14 zile de consecventa', 'description' => 'Ai construit deja o rutina solida.', 'category' => 'consistency', 'icon' => 'FiAward', 'icon_color' => 'rose', 'sort_order' => 25],
            ['template_key' => 'streak_30', 'rule_key' => 'streak_30', 'title' => 'Seria de 30 de zile', 'description' => 'Ai inregistrat starea de spirit 30 de zile la rand.', 'category' => 'consistency', 'icon' => 'FiAward', 'icon_color' => 'rose', 'sort_order' => 30],
            ['template_key' => 'first_journal_entry', 'rule_key' => 'first_journal_entry', 'title' => 'Primul jurnal complet', 'description' => 'Ai salvat prima reflectie completa.', 'category' => 'journal', 'icon' => 'FiHeart', 'icon_color' => 'mint', 'sort_order' => 40],
            ['template_key' => 'first_quick_check_in', 'rule_key' => 'first_quick_check_in', 'title' => 'Primul quick check-in', 'description' => 'Ai notat prima stare rapida.', 'category' => 'journal', 'icon' => 'FiHeart', 'icon_color' => 'mint', 'sort_order' => 45],
            ['template_key' => 'first_assessment', 'rule_key' => 'first_assessment', 'title' => 'Prima evaluare emotionala', 'description' => 'Ai completat prima evaluare ghidata.', 'category' => 'assessment', 'icon' => 'FiClipboard', 'icon_color' => 'rose', 'sort_order' => 50],
            ['template_key' => 'first_appointment', 'rule_key' => 'first_appointment', 'title' => 'Prima programare', 'description' => 'Ai salvat prima programare in aplicatie.', 'category' => 'appointment', 'icon' => 'FiCalendar', 'icon_color' => 'peach', 'sort_order' => 70],
            ['template_key' => 'first_saved_article', 'rule_key' => 'first_saved_article', 'title' => 'Primul articol salvat', 'description' => 'Ai marcat primul articol pentru mai tarziu.', 'category' => 'article', 'icon' => 'FiBookmark', 'icon_color' => 'lilac', 'sort_order' => 80],
            ['template_key' => 'first_article_read', 'rule_key' => 'first_article_read', 'title' => 'Primul articol citit', 'description' => 'Ai explorat primul articol din biblioteca Calming.', 'category' => 'article', 'icon' => 'FiBookOpen', 'icon_color' => 'lilac', 'sort_order' => 85],
            ['template_key' => 'profile_complete', 'rule_key' => 'profile_complete', 'title' => 'Profil complet', 'description' => 'Ai completat profilul pentru recomandari mai bune.', 'category' => 'profile', 'icon' => 'FiUser', 'icon_color' => 'sky', 'sort_order' => 90],
            ['template_key' => 'assistant_opened', 'rule_key' => 'assistant_opened', 'title' => 'Prima deschidere Assistant', 'description' => 'Ai intrat pentru prima data in Assistant.', 'category' => 'assistant', 'icon' => 'FiMessageSquare', 'icon_color' => 'sky', 'sort_order' => 95],
            ['template_key' => 'first_community_access', 'rule_key' => 'first_community_access', 'title' => 'Prima vizita in comunitate', 'description' => 'Ai deschis pentru prima data spatiul de comunitate.', 'category' => 'community', 'icon' => 'FiUsers', 'icon_color' => 'amber', 'sort_order' => 100],
            ['template_key' => 'community_post', 'rule_key' => 'community_post', 'title' => 'Membru al comunitatii', 'description' => 'Ai contribuit cu o postare in comunitate.', 'category' => 'community', 'icon' => 'FiUsers', 'icon_color' => 'amber', 'sort_order' => 110],
        ];
        foreach ($templates as $row) {
            DB::table('milestone_templates')->updateOrInsert(['template_key' => $row['template_key']], $row);
        }

        $resources = [
            ['template_key' => 'about_you', 'label' => 'Despre tine', 'sort_order' => 10],
            ['template_key' => 'emotional_history', 'label' => 'Istoric emotional', 'sort_order' => 20],
            ['template_key' => 'scheduled_sessions', 'label' => 'Sesiuni programate', 'sort_order' => 30],
            ['template_key' => 'ongoing_treatment', 'label' => 'Tratament in curs', 'sort_order' => 40],
        ];
        foreach ($resources as $row) {
            DB::table('resource_templates')->updateOrInsert(['template_key' => $row['template_key']], $row);
        }

        $notificationTemplates = [
            ['key' => 'article_saved', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'article', 'title' => 'Articol salvat', 'message' => 'Articolul a fost salvat in biblioteca ta personala.', 'default_title' => 'Articol salvat', 'default_body' => 'Articolul a fost salvat in biblioteca ta personala.', 'icon' => 'FiBookmark', 'icon_color' => 'lilac', 'accent' => 'lilac', 'cta_kind' => 'open', 'cta_label' => 'Vezi notificarile', 'deep_link' => '/notifications', 'sort_order' => 10],
            ['key' => 'article_reminder_set', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'reminder', 'title' => 'Reminder pentru articol', 'message' => 'Ai activat un reminder pentru a reveni la articol.', 'default_title' => 'Reminder pentru articol', 'default_body' => 'Ai activat un reminder pentru a reveni la articol.', 'icon' => 'FiCalendar', 'icon_color' => 'rose', 'accent' => 'rose', 'cta_kind' => 'open', 'cta_label' => 'Deschide articolul', 'deep_link' => '/learn', 'sort_order' => 20],
            ['key' => 'journal_saved', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'journal', 'title' => 'Intrare noua in jurnal', 'message' => 'Am salvat reflectia ta si am actualizat progresul personal.', 'default_title' => 'Intrare noua in jurnal', 'default_body' => 'Am salvat reflectia ta si am actualizat progresul personal.', 'icon' => 'FiHeart', 'icon_color' => 'mint', 'accent' => 'mint', 'cta_kind' => 'open', 'cta_label' => 'Vezi jurnalul', 'deep_link' => '/journal', 'sort_order' => 30],
            ['key' => 'quick_check_in_saved', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'journal', 'title' => 'Check-in salvat', 'message' => 'Am notat starea ta rapida pentru azi.', 'default_title' => 'Check-in salvat', 'default_body' => 'Am notat starea ta rapida pentru azi.', 'icon' => 'FiHeart', 'icon_color' => 'mint', 'accent' => 'mint', 'cta_kind' => 'open', 'cta_label' => 'Vezi jurnalul', 'deep_link' => '/journal', 'sort_order' => 35],
            ['key' => 'appointment_created', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'appointment', 'title' => 'Programare confirmata', 'message' => 'Programarea ta a fost salvata.', 'default_title' => 'Programare confirmata', 'default_body' => 'Programarea ta a fost salvata.', 'icon' => 'FiCalendar', 'icon_color' => 'peach', 'accent' => 'peach', 'cta_kind' => 'open', 'cta_label' => 'Vezi programarile', 'deep_link' => '/appointments', 'sort_order' => 40],
            ['key' => 'appointment_reminder_24h', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'appointment', 'title' => 'Reminder programare', 'message' => 'Urmeaza programarea ta.', 'default_title' => 'Reminder programare', 'default_body' => 'Urmeaza programarea ta.', 'icon' => 'FiClock', 'icon_color' => 'peach', 'accent' => 'peach', 'cta_kind' => 'open', 'cta_label' => 'Vezi agenda', 'deep_link' => '/appointments', 'sort_order' => 50],
            ['key' => 'appointment_reminder_2h', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'appointment', 'title' => 'Programarea incepe curand', 'message' => 'Mai sunt aproximativ 2 ore pana la programare.', 'default_title' => 'Programarea incepe curand', 'default_body' => 'Mai sunt aproximativ 2 ore pana la programare.', 'icon' => 'FiClock', 'icon_color' => 'coral', 'accent' => 'coral', 'cta_kind' => 'open', 'cta_label' => 'Vezi detaliile', 'deep_link' => '/appointments', 'sort_order' => 60],
            ['key' => 'milestone_unlocked', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'milestone', 'title' => 'Reper nou deblocat', 'message' => 'Ai atins un nou reper in Calming.', 'default_title' => 'Reper nou deblocat', 'default_body' => 'Ai atins un nou reper in Calming.', 'icon' => 'FiAward', 'icon_color' => 'rose', 'accent' => 'rose', 'cta_kind' => 'open', 'cta_label' => 'Vezi profilul', 'deep_link' => '/profile', 'sort_order' => 70],
            ['key' => 'profile_completed', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'profile', 'title' => 'Profil complet', 'message' => 'Profilul tau este complet si poti primi recomandari mai bune.', 'default_title' => 'Profil complet', 'default_body' => 'Profilul tau este complet si poti primi recomandari mai bune.', 'icon' => 'FiUser', 'icon_color' => 'sky', 'accent' => 'sky', 'cta_kind' => 'open', 'cta_label' => 'Vezi profilul', 'deep_link' => '/profile', 'sort_order' => 80],
            ['key' => 'community_member_update', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'community', 'title' => 'Actualizare comunitate', 'message' => 'Exista activitate noua in comunitatea ta.', 'default_title' => 'Actualizare comunitate', 'default_body' => 'Exista activitate noua in comunitatea ta.', 'icon' => 'FiUsers', 'icon_color' => 'amber', 'accent' => 'amber', 'cta_kind' => 'open', 'cta_label' => 'Vezi comunitatea', 'deep_link' => '/community', 'sort_order' => 90],
            ['key' => 'community_public_update', 'audience' => 'general', 'actor_type' => 'both', 'category' => 'community', 'title' => 'Actualizare comunitate', 'message' => 'Activitate noua intr-un grup public Calming.', 'default_title' => 'Actualizare comunitate', 'default_body' => 'Activitate noua intr-un grup public Calming.', 'icon' => 'FiUsers', 'icon_color' => 'amber', 'accent' => 'amber', 'cta_kind' => 'open', 'cta_label' => 'Vezi comunitatea', 'deep_link' => '/community', 'is_repeatable' => 1, 'sort_order' => 100],
            ['key' => 'article_published', 'audience' => 'general', 'actor_type' => 'both', 'category' => 'article', 'title' => 'Articol nou', 'message' => 'A aparut un articol nou in biblioteca Calming.', 'default_title' => 'Articol nou', 'default_body' => 'A aparut un articol nou in biblioteca Calming.', 'icon' => 'FiBookOpen', 'icon_color' => 'lilac', 'accent' => 'lilac', 'cta_kind' => 'open', 'cta_label' => 'Citeste acum', 'deep_link' => '/learn', 'is_repeatable' => 1, 'sort_order' => 110],
            ['key' => 'assistant_tip_ready', 'audience' => 'authenticated', 'actor_type' => 'user', 'category' => 'assistant', 'title' => 'AI Assistant', 'message' => 'Assistantul a pregatit un nou punct de pornire pentru tine.', 'default_title' => 'AI Assistant', 'default_body' => 'Assistantul a pregatit un nou punct de pornire pentru tine.', 'icon' => 'FiMessageSquare', 'icon_color' => 'sky', 'accent' => 'sky', 'cta_kind' => 'open', 'cta_label' => 'Deschide Assistant', 'deep_link' => '/assistant', 'sort_order' => 120],
        ];
        foreach ($notificationTemplates as $row) {
            DB::table('notification_templates')->updateOrInsert(
                ['key' => $row['key']],
                $row + ['priority' => $row['priority'] ?? 3, 'published_at' => now(), 'is_active' => $row['is_active'] ?? 1]
            );
        }

        $articlePublishedTemplateId = DB::table('notification_templates')->where('key', 'article_published')->value('id');
        if ($articlePublishedTemplateId) {
            DB::table('notifications')->updateOrInsert(
                ['dedupe_key' => 'seed:article_published'],
                [
                    'recipient_type' => 'guest',
                    'template_id' => $articlePublishedTemplateId,
                    'category' => 'article',
                    'title' => 'Articol nou in biblioteca',
                    'body' => 'Am publicat un nou articol despre reglare emotionala si rutina de calm.',
                    'icon' => 'FiBookOpen',
                    'icon_color' => 'lilac',
                    'priority' => 3,
                    'status' => 'unread',
                    'published_at' => now()->subDays(2),
                    'created_at' => now()->subDays(2),
                    'updated_at' => now()->subDays(2),
                ]
            );
        }

        $communityTemplateId = DB::table('notification_templates')->where('key', 'community_public_update')->value('id');
        if ($communityTemplateId) {
            DB::table('notifications')->updateOrInsert(
                ['dedupe_key' => 'seed:community_public_update'],
                [
                    'recipient_type' => 'guest',
                    'template_id' => $communityTemplateId,
                    'category' => 'community',
                    'title' => 'Actualizare comunitate',
                    'body' => 'Resurse pentru parinti are activitate noua in aceasta saptamana.',
                    'icon' => 'FiUsers',
                    'icon_color' => 'amber',
                    'priority' => 3,
                    'status' => 'unread',
                    'published_at' => now()->subDay(),
                    'created_at' => now()->subDay(),
                    'updated_at' => now()->subDay(),
                ]
            );
        }

        DB::table('article_topics')->updateOrInsert(['slug' => 'wellness'], ['name' => 'Wellness', 'slug' => 'wellness']);
        DB::table('article_topics')->updateOrInsert(['slug' => 'mindfulness'], ['name' => 'Mindfulness', 'slug' => 'mindfulness']);
        DB::table('article_topics')->updateOrInsert(['slug' => 'somn'], ['name' => 'Somn', 'slug' => 'somn']);

        $psychologistId = DB::table('psychologists')->where('email', 'andreea@example.com')->value('id');
        if (! $psychologistId) {
            $psychologistId = DB::table('psychologists')->insertGetId([
                'title' => 'Dr.',
                'name' => 'Andreea',
                'surname' => 'Ionescu',
                'supports_online' => 1,
                'phone' => '0700000000',
                'email' => 'andreea@example.com',
                'email_verified_at' => now(),
                'password_hash' => bcrypt('password'),
            ]);
        }

        DB::table('psychologist_specialties')->updateOrInsert([
            'psychologist_id' => $psychologistId,
            'label' => 'Psihoterapie cognitiv-comportamentala',
        ], [
            'psychologist_id' => $psychologistId,
            'label' => 'Psihoterapie cognitiv-comportamentala',
        ]);

        DB::table('psychologists_address')->updateOrInsert([
            'psychologist_id' => $psychologistId,
        ], [
            'address' => 'Bd. Unirii 10',
            'city' => 'Bucuresti',
            'county' => 'Bucuresti',
        ]);

        DB::table('psychologist_individual_profiles')->updateOrInsert([
            'psychologist_id' => $psychologistId,
        ], [
            'profession' => 'psihoterapeut',
            'cpr_code' => 'CPR-123456',
            'professional_grade' => 'specialist',
            'license_number' => 'LP-7788',
            'license_issue_date' => now()->subYears(3)->toDateString(),
            'license_expiry_date' => now()->addYears(2)->toDateString(),
            'clinical_competencies' => 'Anxietate, stres, reglare emotionala',
            'years_experience' => 8,
            'practice_languages' => 'Romana, Engleza',
            'office_hours' => 'L-V 09:00-17:00',
        ]);

        DB::table('psychologist_validation_applications')->updateOrInsert([
            'psychologist_id' => $psychologistId,
        ], [
            'entity_type_id' => DB::table('validation_entity_types')->orderBy('id')->value('id'),
            'status' => 'approved',
            'submitted_at' => now()->subDays(30),
            'reviewed_at' => now()->subDays(2),
            'created_at' => now()->subDays(30),
            'updated_at' => now()->subDays(2),
        ]);

        foreach ([
            'Evaluare initiala',
            'Sedinta individuala',
            'Follow-up',
            'Consiliere online',
        ] as $label) {
            DB::table('appointment_types')->updateOrInsert(['label' => $label], ['label' => $label]);
        }

        foreach ([
            '09:00',
            '10:00',
            '11:00',
            '12:00',
            '14:00',
            '15:00',
            '16:00',
            '17:00',
        ] as $slot) {
            DB::table('appointment_time_slots')->updateOrInsert(['slot' => $slot], ['slot' => $slot]);
        }

        DB::table('community_groups')->updateOrInsert(['name' => 'Cercul zilnic de sprijin'], [
            'slug' => 'cercul-zilnic-de-sprijin',
            'description' => 'Spatiu moderat in care ne verificam starea, impartasim mici victorii si ne sustinem in momentele mai grele.',
            'schedule' => 'In fiecare dimineata, 08:30 - 09:00 (Zoom, link fix)',
            'safety_note' => 'Discutiile raman confidentiale. Te rugam sa eviti detalii care implica alte persoane fara acordul lor.',
            'author' => $psychologistId,
            'members' => 428,
            'is_private' => 1,
        ]);

        DB::table('community_groups')->updateOrInsert(['name' => 'Mindfulness si autoingrijire'], [
            'slug' => 'mindfulness-si-autoingrijire',
            'description' => 'Micro-sesiuni ghidate pentru a aseza respiratia si grija personala in pauza de pranz.',
            'schedule' => 'Luni, miercuri si vineri, 12:30 - 12:40 (Zoom drop-in)',
            'safety_note' => 'Exercitiile pot fi adaptate la nivelul tau de confort. Poti participa cu camera oprita si poti intrerupe oricand.',
            'author' => $psychologistId,
            'members' => 189,
            'is_private' => 1,
        ]);

        DB::table('community_groups')->updateOrInsert(['name' => 'Gestionarea stresului'], [
            'slug' => 'gestionarea-stresului',
            'description' => 'Spatiu de invatare si suport pentru a transforma stresul zilnic in strategii constiente.',
            'schedule' => 'Marti si joi, 18:30 - 19:00 (Zoom, grup restrans)',
            'safety_note' => 'Discutiile sunt confidentiale. Te incurajam sa imparti doar atat cat te simti confortabil si sa ceri pauza cand ai nevoie.',
            'author' => $psychologistId,
            'members' => 156,
            'is_private' => 1,
        ]);

        DB::table('community_groups')->updateOrInsert(['name' => 'Resurse pentru parinti'], [
            'slug' => 'resurse-pentru-parinti',
            'description' => 'Cerc de sprijin pentru parinti care cauta strategii blande si resurse pentru echilibru emotional in familie.',
            'schedule' => 'Joi, 17:30 - 18:15 (Zoom, acces deschis cu cont)',
            'safety_note' => 'Ne asiguram ca experientele impartasite raman in comunitate. Protejam identitatea copiilor si punem accent pe responsabilitate comuna.',
            'author' => $psychologistId,
            'members' => 98,
            'is_private' => 0,
        ]);

        $communityGroupPayloads = [
            'cercul-zilnic-de-sprijin' => [
                'focus_areas' => ['Stare emotionala', 'Rutine de bine', 'Suport reciproc', 'Mindfulness scurt'],
                'dialogues' => [
                    ['stamp' => 'Luni, 3 februarie 2025', 'messages' => [
                        ['sender' => 'Iulia (facilitator)', 'role' => 'facilitator', 'time' => '08:30', 'text' => 'Buna dimineata tuturor! Incepem cu un check-in scurt: intr-un cuvant, cum sunteti azi?'],
                        ['sender' => 'Mihai', 'role' => 'participant', 'time' => '08:31', 'text' => "Pentru mine cuvantul de azi e 'curios'."],
                        ['sender' => 'Iulia (facilitator)', 'role' => 'facilitator', 'time' => '08:32', 'reply_to' => 'Mihai', 'text' => 'Multumesc, Mihai. Curiozitatea poate sa ne ofere energie, o notam.'],
                    ]],
                    ['stamp' => 'Marti, 4 februarie 2025', 'messages' => [
                        ['sender' => 'Iulia (facilitator)', 'role' => 'facilitator', 'time' => '08:30', 'text' => 'Ce reusita mica ati avut ieri si vreti sa o consemnati aici?'],
                        ['sender' => 'Lavinia', 'role' => 'participant', 'time' => '08:31', 'text' => 'Am iesit la o plimbare scurta dupa pranz. M-a ajutat sa respir mai lin.'],
                        ['sender' => 'Ruxandra', 'role' => 'participant', 'time' => '08:32', 'reply_to' => 'Lavinia', 'text' => 'Bravo! Mi-ai dat ideea sa imi pun si eu o alarma pentru pauza de mers.'],
                    ]],
                ],
            ],
            'mindfulness-si-autoingrijire' => [
                'focus_areas' => ['Respiratie constienta', 'Reset mental', 'Pauze active', 'Ritualuri de grija'],
                'dialogues' => [
                    ['stamp' => 'Marti, 4 februarie 2025', 'messages' => [
                        ['sender' => 'Radu (facilitator)', 'role' => 'facilitator', 'time' => '12:30', 'text' => 'Bine ati venit! Lucram azi cu un scan corporal ghidat. Alegeti o postura comoda.'],
                        ['sender' => 'Irina', 'role' => 'participant', 'time' => '12:31', 'text' => 'Simt umerii ridicati. Cand ii observ, coboara singuri.'],
                    ]],
                ],
            ],
            'gestionarea-stresului' => [
                'focus_areas' => ['Tehnici de reglare', 'Planificare pragmatica', 'Sprijin reciproc', 'Resurse personale'],
                'dialogues' => [
                    ['stamp' => 'Luni, 3 februarie 2025', 'messages' => [
                        ['sender' => 'Ana (facilitator)', 'role' => 'facilitator', 'time' => '18:30', 'text' => 'Incepem cu un inventar scurt: ce factor de stres simtiti cel mai acut azi?'],
                        ['sender' => 'Sorina', 'role' => 'participant', 'time' => '18:31', 'text' => 'Mi-e greu sa trasez limite in calendar si ma simt coplesita.'],
                    ]],
                ],
            ],
            'resurse-pentru-parinti' => [
                'focus_areas' => ['Ritualuri de familie', 'Emotii la copii', 'Limite sanatoase', 'Sprijin reciproc'],
                'dialogues' => [
                    ['stamp' => 'Marti, 4 februarie 2025', 'messages' => [
                        ['sender' => 'Ioana (facilitator)', 'role' => 'facilitator', 'time' => '17:30', 'text' => 'Buna tuturor! Azi discutam despre ritualurile de seara. Ce a functionat pentru voi in ultima saptamana?'],
                        ['sender' => 'Anca', 'role' => 'participant', 'time' => '17:31', 'text' => 'Am introdus 5 minute de poveste audio. Ajuta la tranzitia catre somn.'],
                    ]],
                ],
            ],
        ];

        foreach ($communityGroupPayloads as $slug => $payload) {
            $groupId = DB::table('community_groups')->where('slug', $slug)->value('id');
            if (! $groupId) {
                continue;
            }

            DB::table('community_group_focus_areas')->where('group_id', $groupId)->delete();
            foreach ($payload['focus_areas'] as $index => $focusArea) {
                DB::table('community_group_focus_areas')->insert([
                    'group_id' => $groupId,
                    'label' => $focusArea,
                    'sort_order' => $index + 1,
                ]);
            }

            $dialogueIds = DB::table('community_dialogues')->where('group_id', $groupId)->pluck('id');
            if ($dialogueIds->isNotEmpty()) {
                DB::table('community_dialogue_messages')->whereIn('dialogue_id', $dialogueIds)->delete();
            }
            DB::table('community_dialogues')->where('group_id', $groupId)->delete();

            foreach ($payload['dialogues'] as $dialogueIndex => $dialogue) {
                $dialogueId = DB::table('community_dialogues')->insertGetId([
                    'group_id' => $groupId,
                    'stamp' => $dialogue['stamp'],
                    'sort_order' => $dialogueIndex + 1,
                ]);

                foreach ($dialogue['messages'] as $messageIndex => $message) {
                    DB::table('community_dialogue_messages')->insert([
                        'dialogue_id' => $dialogueId,
                        'sender' => $message['sender'],
                        'role' => $message['role'] ?? 'participant',
                        'reply_to' => $message['reply_to'] ?? null,
                        'time' => $message['time'] ?? null,
                        'text' => $message['text'],
                        'sort_order' => $messageIndex + 1,
                    ]);
                }
            }
        }

        $articleIds = [];

        foreach (config('calm.articles') as $index => $article) {
            $topicId = DB::table('article_topics')->where('slug', Str::slug($article['tag']))->value('id') ?? DB::table('article_topics')->where('slug', 'wellness')->value('id');
            DB::table('articles')->updateOrInsert(['slug' => $article['slug']], [
                'title' => $article['title'],
                'tag' => $article['tag'],
                'minutes' => $article['minutes'],
                'hero_image' => $article['image'],
                'author' => $psychologistId,
                'body' => json_encode($article['body']),
                'is_recommended' => 1,
                'topic_id' => $topicId,
            ]);

            $articleIds[] = DB::table('articles')->where('slug', $article['slug'])->value('id');
        }

        foreach ($articleIds as $index => $articleId) {
            $relatedId = $articleIds[($index + 1) % count($articleIds)] ?? null;

            if ($articleId && $relatedId && $articleId !== $relatedId) {
                DB::table('related_articles')->updateOrInsert([
                    'article_id' => $articleId,
                    'related_article_id' => $relatedId,
                ], [
                    'sort_order' => $index + 1,
                ]);
            }
        }

        $userId = DB::table('users')->where('email', 'test@example.com')->value('id');
        if ($userId) {
            DB::table('user_profiles')->updateOrInsert(['user_id' => $userId], [
                'display_name' => 'Sarah Mitchell',
                'avatar_initials' => 'SM',
                'member_since' => now()->subMonths(6),
                'profile_completion' => 85,
                'community_alias' => 'Sarah M.',
            ]);

            DB::table('user_profile_details')->updateOrInsert(['user_id' => $userId], [
                'age_range' => '25-34',
                'focus_topics' => json_encode(['Gestionarea anxietatii', 'Somn si recuperare']),
                'primary_goal' => 'Vreau sa imi stabilizez rutina si sa imi reduc anxietatea.',
                'stress_triggers' => 'Munca intensa si lipsa somnului.',
                'coping_strategies' => 'Plimbari, respiratie si muzica.',
                'guidance_style' => 'calm-empathetic',
                'check_in_preference' => 'evening',
                'therapy_status' => 'considering',
                'notification_frequency' => 'three-per-week',
            ]);

            foreach ([
                ['metric_key' => 'journal_entries', 'label' => 'Intrari in jurnal', 'value' => '45', 'tone' => 'rose', 'icon' => 'FiActivity', 'sort_order' => 10],
                ['metric_key' => 'good_days', 'label' => 'Zile bune', 'value' => '28 zile', 'tone' => 'teal', 'icon' => 'FiHeart', 'sort_order' => 20],
                ['metric_key' => 'stress_level', 'label' => 'Nivel mediu stres: Bine', 'value' => '🙂', 'tone' => 'amber', 'icon' => 'FiTrendingUp', 'sort_order' => 30],
                ['metric_key' => 'active_days', 'label' => 'Zile active', 'value' => '87 zile', 'tone' => 'indigo', 'icon' => 'FiCalendar', 'sort_order' => 40],
            ] as $row) {
                DB::table('user_stats')->updateOrInsert([
                    'user_id' => $userId,
                    'metric_key' => $row['metric_key'],
                ], $row + ['user_id' => $userId]);
            }

            foreach (['streak_30', 'first_assessment', 'community_post'] as $offset => $key) {
                $templateId = DB::table('milestone_templates')->where('template_key', $key)->value('id');
                if ($templateId) {
                    DB::table('user_milestones')->updateOrInsert([
                        'user_id' => $userId,
                        'template_id' => $templateId,
                    ], [
                        'achieved_at' => now()->subDays(20 - ($offset * 5)),
                    ]);
                }
            }
        }
    }
}
