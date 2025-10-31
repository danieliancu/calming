USE calming_app;
SET NAMES 'utf8mb4';

INSERT INTO users (first_name, last_name, email, password_hash, phone, city, country)
VALUES
  ('Sarah', 'Mitchell', 'sarah.mitchell@example.com', '$2b$10$8i3KpH06unBGWT04d4nkA.E1/tHd1WAtwFUVBVnE7YBz6.yZTK4h.', '+40 723 000 111', 'Bucuresti', 'Romania'),
  ('Andreea', 'Ionescu', 'andreea.ionescu@example.com', '$2b$10$8i3KpH06unBGWT04d4nkA.E1/tHd1WAtwFUVBVnE7YBz6.yZTK4h.', '+40 722 555 101', 'Cluj-Napoca', 'Romania'),
  ('Mihai', 'Popescu', 'mihai.popescu@example.com', '$2b$10$8i3KpH06unBGWT04d4nkA.E1/tHd1WAtwFUVBVnE7YBz6.yZTK4h.', '+40 721 400 222', 'Brasov', 'Romania'),
  ('Ioana', 'Radu', 'ioana.radu@example.com', '$2b$10$8i3KpH06unBGWT04d4nkA.E1/tHd1WAtwFUVBVnE7YBz6.yZTK4h.', '+40 723 888 333', 'Timisoara', 'Romania');

INSERT INTO user_profiles (user_id, display_name, member_since, avatar_initials, profile_completion)
VALUES
  (1, 'Sarah Mitchell', '2025-09-03', 'SM', 85);

INSERT INTO user_stats (user_id, metric_key, label, value, tone, icon)
VALUES
  (1, 'journal_entries', 'Intrari in jurnal', '45', 'rose', 'FiActivity'),
  (1, 'good_days', 'Zile bune', '28/30', 'teal', 'FiHeart'),
  (1, 'stress_level', 'Nivel mediu stres', '2.3/10', 'amber', 'FiTrendingUp'),
  (1, 'active_days', 'Zile active', '87', 'indigo', 'FiCalendar');

INSERT INTO user_milestones (user_id, title, description, achieved_at)
VALUES
  (1, 'Serie de 30 de zile', 'Ai inregistrat starea de spirit 30 de zile la rand', '2025-10-15'),
  (1, 'Prima evaluare emotionala', 'Ai finalizat prima reflectie lunara asupra emotiilor', '2025-09-20'),
  (1, 'Membru al comunitatii', 'Te-ai alaturat primului grup de sprijin', '2025-09-01');

INSERT INTO user_info_links (user_id, label, sort_order)
VALUES
  (1, 'Despre tine', 1),
  (1, 'Istoric emotional', 2),
  (1, 'Sesiuni programate', 3),
  (1, 'Tratament in curs', 4);

INSERT INTO mood_options (label, emoji)
VALUES
  ('Minunat', '😊'),
  ('Bine', '🙂'),
  ('În regula', '😌'),
  ('Supărat', '😔'),
  ('Obosit', '😴'),
  ('Dezamăgit', '😞');

INSERT INTO faqs (question, answer, link_href, link_text, link_hint)
VALUES
  ('Cum incepe o conversatie cu Asistentul AI?', 'Deschide zona dedicata si scrie intrebarea sau subiectul tau. Asistentul este disponibil permanent pentru sprijin rapid.', '/assistant', 'Deschide Asistentul', 'Navigheaza catre sectiunea Asistent.'),
  ('Cum adaug o intrare de jurnal?', 'Din orice pagina poti deschide Jurnalul tau, completezi starea, contextul si notele, apoi salvezi.', '/journal/new', 'Creeaza intrare noua', 'Se deschide modalul de jurnal.'),
  ('Pot deschide jurnalul din alte pagini?', 'Da. Jurnalul se deschide peste orice pagina si il poti inchide rapid pentru a continua activitatea.', '/', 'Vezi Jurnalul', 'Butonul se afla in meniul principal.'),
  ('Se salveaza datele jurnalului?', 'Aceasta versiune demo salveaza datele local, dar aplicatia finala le stocheaza securizat in contul tau.', NULL, NULL, NULL),
  ('Ce este Comunitatea?', 'In Comunitate gasesti grupuri tematice unde poti interactiona cu alti membri si cu moderatori.', '/community', 'Exploreaza comunitatea', 'Lista completa de grupuri'),
  ('Primesc notificari si remindere?', 'Da. Poti activa reminder pentru jurnal si vei primi alerte despre programari si articole noi.', '/notifications', 'Vezi notificari', 'Personalizeaza preferintele.'),
  ('Unde imi gestionez profilul si setarile?', 'De pe coltul din dreapta al aplicatiei poti accesa informatiile personale si preferintele tale.', '/profile', 'Deschide profilul', 'Editeaza detaliile contului.'),
  ('Cum folosesc rapid functiile cheie?', 'In sectiunea Actiuni rapide gasesti scurtaturi catre cele mai importante functii ale platformei.', '/', 'Actiuni rapide', 'Acceseaza din homepage.');

INSERT INTO articles (slug, title, tag, minutes, hero_image, author, body, is_recommended)
VALUES
  ('exercitii-de-respiratie-pentru-calm', 'Exercitii de respiratie pentru calm', 'Wellness', 5, '/images/calm-breathing.svg', 'Dr. Sarah Mitchell',
   'Respiratia constienta este una dintre cele mai rapide modalitati de a-ti echilibra sistemul nervos.\n\nIncepe prin a inspira lent pe nas numarand pana la patru, mentine respiratia pana la sapte, apoi expira usor pe gura pana la opt. Repeta ciclul de cel putin cinci ori pentru a resimti un efect de calmare.\n\nEste util sa practici in acelasi moment al zilei pentru a iti crea un reflex sanatos.',
   1),
  ('cum-sa-incepi-un-jurnal-al-emotiilor', 'Cum sa incepi un jurnal al emotiilor', 'Mindfulness', 7, '/images/mindful-journal.svg', 'Dr. Ioana Radu',
   'Un jurnal al emotiilor te ajuta sa iti identifici tiparele si sa vezi ce context iti influenteaza starea.\n\nStabileste un moment al zilei in care scrii cateva ganduri scurte. Noteaza cum te simti, ce a declansat emotia si cum ai reactionat. Dupa cateva saptamani vei observa trenduri utile.\n\nPastreaza-ti jurnalul intr-un loc sigur si revizuieste-l saptamanal pentru insight-uri.',
   1),
  ('rutina-de-seara-in-4-pasi', 'Rutina de seara in 4 pasi', 'Somn', 4, '/images/night-routine.svg', 'Dr. Mihai Popescu',
   'Somnul odihnitor incepe cu o rutina consecventa. Alege patru pasi simpli: reducerea luminilor, o activitate relaxanta, respiratie ghidata si jurnalizare scurta.\n\nRepeta aceiasi pasi timp de doua saptamani pentru a-ti seta organismul pe modul de odihna. Micile ritualuri creeaza un semnal clar pentru corp ca este timpul pentru somn.',
   1),
  ('ghid-autoexaminare-constienta', 'Ghid de autoexaminare constienta', 'Wellness', 6, '/images/calm-breathing.svg', 'Dr. Andreea Ionescu',
   'Autoexaminarea lunara este un obicei valoros pentru a ramane conectat cu corpul tau.\n\nPozitioneaza-te in fata oglinzii si observa orice modificari vizibile, precum schimbari de forma sau textura. Continua examinarea culcat pe spate pentru a simti diferente subtile.\n\nNoteaza tot ce observi si discuta cu medicul daca ceva persista.',
   0);

INSERT INTO article_topics (title, article_count)
VALUES
  ('Gestionarea anxietatii', 12),
  ('Somn & relaxare', 9),
  ('Mindfulness & respiratie', 15),
  ('Relatii & comunicare', 8);

INSERT INTO related_articles (article_id, related_article_id, sort_order)
SELECT a1.id, a2.id, 1
FROM articles a1
JOIN articles a2 ON a2.slug = 'cum-sa-incepi-un-jurnal-al-emotiilor'
WHERE a1.slug = 'exercitii-de-respiratie-pentru-calm';

INSERT INTO related_articles (article_id, related_article_id, sort_order)
SELECT a1.id, a2.id, 2
FROM articles a1
JOIN articles a2 ON a2.slug = 'rutina-de-seara-in-4-pasi'
WHERE a1.slug = 'exercitii-de-respiratie-pentru-calm';

INSERT INTO related_articles (article_id, related_article_id, sort_order)
SELECT a1.id, a2.id, 3
FROM articles a1
JOIN articles a2 ON a2.slug = 'ghid-autoexaminare-constienta'
WHERE a1.slug = 'exercitii-de-respiratie-pentru-calm';

INSERT INTO community_groups (name, members, last_active, is_private)
VALUES
  ('Cercul zilnic de sprijin', 234, '2m', 1),
  ('Mindfulness si autoingrijire', 189, '1h', 1),
  ('Gestionarea stresului', 156, '15m', 1),
  ('Resurse pentru parinti', 98, '3h', 0);

INSERT INTO psychologists (full_name, specialty, rating, distance_km)
VALUES
  ('Dr. Andreea Ionescu', 'Psihoterapie cognitiv-comportamentala', 5.0, 2.3),
  ('Mihai Popescu', 'Psiholog clinician', 4.9, 3.1),
  ('Ioana Radu', 'Consiliere anxietate & stres', 5.0, 3.8),
  ('Dr. Raluca Enache', 'Terapie de cuplu si familie', 4.8, 4.2);

INSERT INTO appointment_types (label)
VALUES
  ('Consultatie'),
  ('Evaluare'),
  ('Follow-up'),
  ('Consiliere online');

INSERT INTO appointment_time_slots (slot)
VALUES
  ('09:00'),
  ('10:00'),
  ('11:00'),
  ('14:00'),
  ('15:00'),
  ('16:00'),
  ('18:30');

INSERT INTO notifications (user_id, title, message, icon, accent, created_at)
VALUES
  (1, 'Reminder autoexaminare', 'Este momentul pentru autoexaminarea lunara.', 'FiCalendar', 'rose', NOW() - INTERVAL 2 HOUR),
  (1, 'Asistent AI', 'Am pregatit recomandari personalizate pentru tine.', 'FiMessageCircle', 'violet', NOW() - INTERVAL 5 HOUR),
  (1, 'Actualizare comunitate', 'Postare noua in Cercul zilnic de sprijin.', 'FiUsers', 'white', NOW() - INTERVAL 1 DAY),
  (1, 'Articol nou', 'Intelege mai bine cum poti gestiona starile dificile.', 'FiBookOpen', 'white', NOW() - INTERVAL 2 DAY),
  (1, 'Reminder programare', 'Sedinta ta este programata pe 25 octombrie la ora 10:00.', 'FiClock', 'white', NOW() - INTERVAL 3 DAY),
  (1, 'Verificare zilnica', 'Cum te simti astazi? Ia un moment sa notezi in jurnal.', 'FiHeart', 'white', NOW() - INTERVAL 7 DAY);

INSERT INTO journal_context_tags (label)
VALUES
  ('Munca'),
  ('Familie'),
  ('Financiar'),
  ('Sanatate'),
  ('Somn insuficient'),
  ('Eveniment social'),
  ('Relatii'),
  ('Autoingrijire');

INSERT INTO journal_symptom_tags (label)
VALUES
  ('Anxietate'),
  ('Atac de panica'),
  ('Tristete'),
  ('Iritabilitate'),
  ('Oboseala'),
  ('Probleme de somn'),
  ('Ganduri intruzive'),
  ('Dificultati de concentrare'),
  ('Lipsa de energie'),
  ('Retragere sociala');

INSERT INTO journal_entries (user_id, mood_id, intensity, notes, created_at)
VALUES
  (1, (SELECT id FROM mood_options WHERE label = 'Bine'), 4, 'Dimineata linistita dupa exercitii de respiratie.', NOW() - INTERVAL 1 DAY),
  (1, (SELECT id FROM mood_options WHERE label = 'Ok'), 5, 'Zi incarcata la birou, dar am reusit sa iau pauze scurte.', NOW() - INTERVAL 3 DAY),
  (1, (SELECT id FROM mood_options WHERE label = 'Greu'), 7, 'Discutie tensionata cu un coleg, vreau sa lucrez la raspunsurile mele.', NOW() - INTERVAL 5 DAY);

INSERT INTO journal_quick_entries (user_id, mood_id, notes, created_at)
VALUES
  (1, (SELECT id FROM mood_options WHERE label = 'Minunat'), 'Cafeaua de dimineata mi-a dat energie buna.', NOW() - INTERVAL 12 HOUR),
  (1, (SELECT id FROM mood_options WHERE label = 'Obosit'), 'Am dormit mai putin, incerc sa ma odihnesc la pranz.', NOW() - INTERVAL 2 DAY);

INSERT INTO journal_entry_contexts (entry_id, context_id)
SELECT je.id, jc.id
FROM journal_entries je
JOIN journal_context_tags jc ON jc.label IN ('Munca')
WHERE je.notes LIKE '%birou%';

INSERT INTO journal_entry_contexts (entry_id, context_id)
SELECT je.id, jc.id
FROM journal_entries je
JOIN journal_context_tags jc ON jc.label IN ('Autoingrijire')
WHERE je.notes LIKE '%respiratie%';

INSERT INTO journal_entry_symptoms (entry_id, symptom_id)
SELECT je.id, js.id
FROM journal_entries je
JOIN journal_symptom_tags js ON js.label = 'Oboseala'
WHERE je.notes LIKE '%pauze%';
