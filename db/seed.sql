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

INSERT INTO user_stats (user_id, metric_key, label, value, tone, icon, sort_order)
VALUES
  (1, 'journal_entries', 'Intrari in jurnal', '45', 'rose', 'FiActivity', 10),
  (1, 'good_days', 'Zile bune', '28/30', 'teal', 'FiHeart', 20),
  (1, 'stress_level', 'Nivel mediu stres', '2.3/10', 'amber', 'FiTrendingUp', 30),
  (1, 'active_days', 'Zile active', '87', 'indigo', 'FiCalendar', 40);

INSERT INTO resource_templates (template_key, label, sort_order)
VALUES
  ('about_you', 'Despre tine', 10),
  ('emotional_history', 'Istoric emotional', 20),
  ('scheduled_sessions', 'Sesiuni programate', 30),
  ('ongoing_treatment', 'Tratament in curs', 40);

INSERT INTO milestone_templates (template_key, title, description, category, sort_order)
VALUES
  ('streak_3', 'Primele 3 zile consecutive', 'Ai inregistrat jurnalul trei zile la rand.', 'consistency', 10),
  ('streak_7', 'Seria de 7 zile', 'Ai mentinut practica zilnica timp de o saptamana.', 'consistency', 20),
  ('streak_30', 'Seria de 30 de zile', 'Ai inregistrat starea de spirit 30 de zile la rand.', 'consistency', 30),
  ('streak_90', 'Seria de 90 de zile', 'Ai ramas consecvent timp de 90 de zile.', 'consistency', 40),
  ('first_assessment', 'Prima evaluare emotionala', 'Ai completat prima evaluare ghidata.', 'assessment', 50),
  ('profile_complete', 'Profil complet', 'Ai completat toate detaliile importante din profil.', 'assessment', 60),
  ('reassessment_90', 'Reevaluare dupa 90 de zile', 'Ai realizat reevaluarea emotionala.', 'assessment', 70),
  ('journal_first', 'Primul jurnal complet', 'Ai salvat prima intrare completa de jurnal.', 'practice', 80),
  ('journal_five_week', 'Cinci jurnale intr-o saptamana', 'Ai notat cinci intrari intr-o singura saptamana.', 'practice', 90),
  ('session_first', 'Prima sesiune cu specialist', 'Ai finalizat o sedinta cu un specialist.', 'practice', 100),
  ('community_post', 'Prima interventie in comunitate', 'Ai contribuit cu o postare in comunitate.', 'community', 110),
  ('community_engaged', 'Zece interactiuni pozitive', 'Ai interactionat activ in comunitate de zece ori.', 'community', 120),
  ('resource_first_article', 'Primul articol citit', 'Ai parcurs primul articol recomandat.', 'resources', 130),
  ('resource_three_articles', 'Trei articole finalizate', 'Ai citit trei articole recomandate.', 'resources', 140),
  ('resource_guided_exercise', 'Primul exercitiu ghidat', 'Ai finalizat primul exercitiu ghidat.', 'resources', 150);

INSERT INTO user_milestones (user_id, template_id, achieved_at)
VALUES
  (1, (SELECT id FROM milestone_templates WHERE template_key = 'streak_30'), '2025-10-15'),
  (1, (SELECT id FROM milestone_templates WHERE template_key = 'first_assessment'), '2025-09-20'),
  (1, (SELECT id FROM milestone_templates WHERE template_key = 'community_post'), '2025-09-01');

INSERT INTO mood_options (label, emoji)
VALUES
  ('Minunat', ':D'),
  ('Bine', ':)'),
  ('Ok', ':|'),
  ('In regula', ':)'),
  ('Suparat', ':('),
  ('Obosit', ':/'),
  ('Dezamagit', ':/'),
  ('Greu', ':/');

INSERT INTO notification_templates (audience, title, message, icon, accent, published_at, sort_order)
VALUES
  ('general', 'Descopera ghidul de gestionare a stresului', 'Afla tehnici rapide pentru a reduce tensiunea zilnica.', 'FiBookOpen', 'mint', NOW() - INTERVAL 2 DAY, 10),
  ('general', 'Testeaza evaluarea emotionala', 'Completeaza autoevaluarea gratuita pentru recomandari personalizate.', 'FiActivity', 'teal', NOW() - INTERVAL 3 DAY, 20),
  ('general', 'Webinarii live din aceasta luna', 'Rezerva-ti un loc la discutiile sustinute de specialistii Calming.', 'FiCalendar', 'violet', NOW() - INTERVAL 5 DAY, 30),
  ('general', 'Alatura-te comunitatii Calming', 'Vezi cum te poate sprijini cercul nostru de suport.', 'FiUsers', 'indigo', NOW() - INTERVAL 6 DAY, 40),
  ('general', 'Articole recomandate pentru sezon', 'Colectie de resurse potrivite pentru perioada actuala.', 'FiStar', 'amber', NOW() - INTERVAL 7 DAY, 50),
  ('authenticated', 'Completeaza profilul tau', 'Adauga detalii pentru recomandari mai bune si notificari personalizate.', 'FiUser', 'sky', NOW() - INTERVAL 1 DAY, 10),
  ('authenticated', 'Pastreaza seria zilnica', 'Nu uita sa adaugi intrarea de jurnal pentru astazi.', 'FiHeart', 'rose', NOW() - INTERVAL 12 HOUR, 20),
  ('authenticated', 'Reevaluare emotionala disponibila', 'Este timpul sa refaci evaluarea ghidata pentru a intelege progresul.', 'FiTrendingUp', 'amber', NOW() - INTERVAL 4 DAY, 30),
  ('authenticated', 'Grupul tau are discutii noi', 'Revino in comunitate si continua conversatia.', 'FiMessageCircle', 'indigo', NOW() - INTERVAL 8 HOUR, 40),
  ('authenticated', 'Sloturi noi pentru sedinte', 'Specialistii recomandati au disponibilitate in urmatoarele zile.', 'FiClock', 'violet', NOW() - INTERVAL 2 DAY, 50),
  ('authenticated', 'Reminder autoexaminare', 'Este momentul pentru autoexaminarea lunara.', 'FiCalendar', 'rose', NOW() - INTERVAL 4 DAY, 60),
  ('authenticated', 'Asistent AI', 'Am pregatit recomandari personalizate pentru tine.', 'FiMessageCircle', 'violet', NOW() - INTERVAL 5 HOUR, 70),
  ('authenticated', 'Actualizare comunitate', 'Postare noua in Cercul zilnic de sprijin.', 'FiUsers', 'white', NOW() - INTERVAL 1 DAY, 80),
  ('authenticated', 'Articol nou', 'Intelege mai bine cum poti gestiona starile dificile.', 'FiBookOpen', 'white', NOW() - INTERVAL 2 DAY, 90),
  ('authenticated', 'Reminder programare', 'Sedinta ta este programata pe 25 octombrie la ora 10:00.', 'FiClock', 'white', NOW() - INTERVAL 3 DAY, 100),
  ('authenticated', 'Verificare zilnica', 'Cum te simti astazi? Ia un moment sa notezi in jurnal.', 'FiHeart', 'white', NOW() - INTERVAL 7 DAY, 110),
  ('authenticated', 'Verificare rapida', 'Cum te simti astazi? Deschide jurnalul si noteaza cateva ganduri.', 'FiHeart', 'rose', NOW() - INTERVAL 2 HOUR, 120);

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
   'Somnul odihnitor incepe cu o rutina consecventa. Alege o ora fixa pentru culcare, limiteaza expunerea la ecrane si creeaza un ritual calmant, precum cititul sau exercitiile de respiratie.\n\nReducerea luminii artificiale cu 30 de minute inainte de somn ajuta creierul sa produca melatonina. Noteaza in jurnal ce functioneaza pentru tine pentru a ramane consecvent.',
   1),
  ('calming-comunitate', 'De ce merita sa te implici in comunitate', 'Relatii', 6, '/images/community.svg', 'Dr. Andreea Ionescu',
   'Sprijinul social este esential pentru echilibru emotional. Comunitatea Calming ofera spatiu sigur unde poti pune intrebari si primi materiale utile de la psihologi.\n\nImplicarea constanta te ajuta sa construiesti obiceiuri sanatoase si sa inveti din experientele altor membri.',
   0),
  ('ghid-rapid-pentru-jurnal', 'Ghid rapid pentru jurnalul emotiilor', 'Mindfulness', 6, '/images/journal-guide.svg', 'Dr. Ioana Radu',
   'Jurnalul emotional poate deveni punctul tau de sprijin zilnic. Foloseste un template simplu: emotie principala, context si raspunsul tau.\n\nRevizuieste intrarile o data pe saptamana pentru a observa tiparele si pentru a pregati discutii cu specialistul tau.',
   0),
  ('cum-sa-alegi-psihologul', 'Cum sa alegi psihologul potrivit', 'Resurse', 8, '/images/choose-psychologist.svg', 'Dr. Mihai Popescu',
   'Alegerea unui psiholog necesita claritate asupra obiectivelor tale. Noteaza ce doresti sa obtii din terapie si intreaba despre stilul de lucru al specialistului.\n\nIn Calming poti compara specialistii disponibili, ratingurile lor si domeniile in care sunt certificati.',
   0);

INSERT INTO article_topics (title, article_count)
VALUES
  ('Gestionarea stresului', 12),
  ('Mindfulness', 8),
  ('Relatii', 6),
  ('Somn si relaxare', 4);

INSERT INTO related_articles (article_id, related_article_id, sort_order)
VALUES
  ((SELECT id FROM articles WHERE slug = 'exercitii-de-respiratie-pentru-calm'), (SELECT id FROM articles WHERE slug = 'ghid-rapid-pentru-jurnal'), 1),
  ((SELECT id FROM articles WHERE slug = 'exercitii-de-respiratie-pentru-calm'), (SELECT id FROM articles WHERE slug = 'cum-sa-incepi-un-jurnal-al-emotiilor'), 2),
  ((SELECT id FROM articles WHERE slug = 'cum-sa-incepi-un-jurnal-al-emotiilor'), (SELECT id FROM articles WHERE slug = 'ghid-rapid-pentru-jurnal'), 1),
  ((SELECT id FROM articles WHERE slug = 'rutina-de-seara-in-4-pasi'), (SELECT id FROM articles WHERE slug = 'exercitii-de-respiratie-pentru-calm'), 1);

INSERT INTO community_groups (name, members, last_active, is_private)
VALUES
  ('Cercul zilnic de sprijin', 428, '5 ore', 1),
  ('Mindfulness in 10 minute', 312, '1 zi', 0),
  ('Parinti si echilibru emotional', 289, '2 zile', 1),
  ('Rezistenta in perioade dificile', 201, '3 zile', 1);

INSERT INTO psychologists (full_name, specialty, rating, distance_km)
VALUES
  ('Dr. Ioana Radu', 'Psihoterapie cognitiv-comportamentala', 4.9, 3.2),
  ('Dr. Mihai Popescu', 'Terapie integrativa si coaching', 4.8, 5.1),
  ('Dr. Sarah Mitchell', 'Terapie pentru cupluri si familie', 4.7, 2.5),
  ('Dr. Andreea Ionescu', 'Psihologie clinica si mindfulness', 4.9, 1.8);

INSERT INTO appointment_types (label)
VALUES
  ('Evaluare initiala'),
  ('Sedinta individuala'),
  ('Sedinta de cuplu'),
  ('Sedinta de follow-up');

INSERT INTO appointment_time_slots (slot)
VALUES
  ('09:00'),
  ('10:30'),
  ('12:00'),
  ('14:30'),
  ('16:00'),
  ('18:00');

INSERT INTO user_notifications (user_id, template_id, title, message, icon, accent, created_at)
VALUES
  (1, (SELECT id FROM notification_templates WHERE audience = 'authenticated' AND title = 'Verificare rapida'), NULL, NULL, NULL, NULL, NOW() - INTERVAL 2 HOUR),
  (1, (SELECT id FROM notification_templates WHERE audience = 'authenticated' AND title = 'Asistent AI'), NULL, NULL, NULL, NULL, NOW() - INTERVAL 5 HOUR),
  (1, (SELECT id FROM notification_templates WHERE audience = 'authenticated' AND title = 'Actualizare comunitate'), NULL, NULL, NULL, NULL, NOW() - INTERVAL 1 DAY),
  (1, (SELECT id FROM notification_templates WHERE audience = 'authenticated' AND title = 'Articol nou'), NULL, NULL, NULL, NULL, NOW() - INTERVAL 2 DAY),
  (1, (SELECT id FROM notification_templates WHERE audience = 'authenticated' AND title = 'Reminder programare'), NULL, NULL, NULL, NULL, NOW() - INTERVAL 3 DAY),
  (1, (SELECT id FROM notification_templates WHERE audience = 'authenticated' AND title = 'Verificare zilnica'), NULL, NULL, NULL, NULL, NOW() - INTERVAL 7 DAY);

INSERT INTO journal_context_tags (label)
VALUES
  ('Munca'),
  ('Familie'),
  ('Financiar'),
  ('Sanatate'),
  ('Somn insuficient'),
  ('Eveniment social'),
  ('Relatii'),
  ('Autoingrijire'),
  ('Studii'),
  ('Activitate fizica'),
  ('Calatorie');

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
  ('Retragere sociala'),
  ('Energie ridicata'),
  ('Recunostinta'),
  ('Calm interior'),
  ('Motivatie'),
  ('Conectat cu ceilalti'),
  ('Optimism'),
  ('Neutralitate'),
  ('Atentie'),
  ('Focalizare');

INSERT INTO mood_symptom_links (mood_id, symptom_id)
VALUES
  ((SELECT id FROM mood_options WHERE label = 'Minunat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Energie ridicata')),
  ((SELECT id FROM mood_options WHERE label = 'Minunat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Recunostinta')),
  ((SELECT id FROM mood_options WHERE label = 'Minunat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Calm interior')),
  ((SELECT id FROM mood_options WHERE label = 'Minunat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Motivatie')),
  ((SELECT id FROM mood_options WHERE label = 'Minunat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Conectat cu ceilalti')),
  ((SELECT id FROM mood_options WHERE label = 'Minunat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Optimism')),
  ((SELECT id FROM mood_options WHERE label = 'Bine'), (SELECT id FROM journal_symptom_tags WHERE label = 'Motivatie')),
  ((SELECT id FROM mood_options WHERE label = 'Bine'), (SELECT id FROM journal_symptom_tags WHERE label = 'Conectat cu ceilalti')),
  ((SELECT id FROM mood_options WHERE label = 'Bine'), (SELECT id FROM journal_symptom_tags WHERE label = 'Optimism')),
  ((SELECT id FROM mood_options WHERE label = 'Bine'), (SELECT id FROM journal_symptom_tags WHERE label = 'Recunostinta')),
  ((SELECT id FROM mood_options WHERE label = 'Bine'), (SELECT id FROM journal_symptom_tags WHERE label = 'Atentie')),
  ((SELECT id FROM mood_options WHERE label = 'Bine'), (SELECT id FROM journal_symptom_tags WHERE label = 'Calm interior')),
  ((SELECT id FROM mood_options WHERE label = 'Ok'), (SELECT id FROM journal_symptom_tags WHERE label = 'Neutralitate')),
  ((SELECT id FROM mood_options WHERE label = 'Ok'), (SELECT id FROM journal_symptom_tags WHERE label = 'Focalizare')),
  ((SELECT id FROM mood_options WHERE label = 'Ok'), (SELECT id FROM journal_symptom_tags WHERE label = 'Atentie')),
  ((SELECT id FROM mood_options WHERE label = 'Ok'), (SELECT id FROM journal_symptom_tags WHERE label = 'Optimism')),
  ((SELECT id FROM mood_options WHERE label = 'Ok'), (SELECT id FROM journal_symptom_tags WHERE label = 'Motivatie')),
  ((SELECT id FROM mood_options WHERE label = 'Ok'), (SELECT id FROM journal_symptom_tags WHERE label = 'Conectat cu ceilalti')),
  ((SELECT id FROM mood_options WHERE label = 'In regula'), (SELECT id FROM journal_symptom_tags WHERE label = 'Neutralitate')),
  ((SELECT id FROM mood_options WHERE label = 'In regula'), (SELECT id FROM journal_symptom_tags WHERE label = 'Focalizare')),
  ((SELECT id FROM mood_options WHERE label = 'In regula'), (SELECT id FROM journal_symptom_tags WHERE label = 'Atentie')),
  ((SELECT id FROM mood_options WHERE label = 'In regula'), (SELECT id FROM journal_symptom_tags WHERE label = 'Calm interior')),
  ((SELECT id FROM mood_options WHERE label = 'In regula'), (SELECT id FROM journal_symptom_tags WHERE label = 'Motivatie')),
  ((SELECT id FROM mood_options WHERE label = 'In regula'), (SELECT id FROM journal_symptom_tags WHERE label = 'Optimism')),
  ((SELECT id FROM mood_options WHERE label = 'Obosit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Oboseala')),
  ((SELECT id FROM mood_options WHERE label = 'Obosit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Probleme de somn')),
  ((SELECT id FROM mood_options WHERE label = 'Obosit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Lipsa de energie')),
  ((SELECT id FROM mood_options WHERE label = 'Obosit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Dificultati de concentrare')),
  ((SELECT id FROM mood_options WHERE label = 'Obosit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Tristete')),
  ((SELECT id FROM mood_options WHERE label = 'Obosit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Anxietate')),
  ((SELECT id FROM mood_options WHERE label = 'Suparat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Tristete')),
  ((SELECT id FROM mood_options WHERE label = 'Suparat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Iritabilitate')),
  ((SELECT id FROM mood_options WHERE label = 'Suparat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Retragere sociala')),
  ((SELECT id FROM mood_options WHERE label = 'Suparat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Anxietate')),
  ((SELECT id FROM mood_options WHERE label = 'Suparat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Ganduri intruzive')),
  ((SELECT id FROM mood_options WHERE label = 'Suparat'), (SELECT id FROM journal_symptom_tags WHERE label = 'Probleme de somn')),
  ((SELECT id FROM mood_options WHERE label = 'Dezamagit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Tristete')),
  ((SELECT id FROM mood_options WHERE label = 'Dezamagit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Lipsa de energie')),
  ((SELECT id FROM mood_options WHERE label = 'Dezamagit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Ganduri intruzive')),
  ((SELECT id FROM mood_options WHERE label = 'Dezamagit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Retragere sociala')),
  ((SELECT id FROM mood_options WHERE label = 'Dezamagit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Anxietate')),
  ((SELECT id FROM mood_options WHERE label = 'Dezamagit'), (SELECT id FROM journal_symptom_tags WHERE label = 'Dificultati de concentrare')),
  ((SELECT id FROM mood_options WHERE label = 'Greu'), (SELECT id FROM journal_symptom_tags WHERE label = 'Atac de panica')),
  ((SELECT id FROM mood_options WHERE label = 'Greu'), (SELECT id FROM journal_symptom_tags WHERE label = 'Ganduri intruzive')),
  ((SELECT id FROM mood_options WHERE label = 'Greu'), (SELECT id FROM journal_symptom_tags WHERE label = 'Anxietate')),
  ((SELECT id FROM mood_options WHERE label = 'Greu'), (SELECT id FROM journal_symptom_tags WHERE label = 'Dificultati de concentrare')),
  ((SELECT id FROM mood_options WHERE label = 'Greu'), (SELECT id FROM journal_symptom_tags WHERE label = 'Lipsa de energie')),
  ((SELECT id FROM mood_options WHERE label = 'Greu'), (SELECT id FROM journal_symptom_tags WHERE label = 'Probleme de somn'));

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
