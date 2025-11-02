USE calming_app;

START TRANSACTION;

-- Normalize symptom IDs in journal_entry_symptoms to the lowest id per label
UPDATE journal_entry_symptoms jes
JOIN (
  SELECT t.id AS old_id,
         (SELECT MIN(id) FROM journal_symptom_tags WHERE label = t.label) AS new_id
  FROM journal_symptom_tags t
) map ON jes.symptom_id = map.old_id
SET jes.symptom_id = map.new_id;

-- Remove duplicate symptom tags by label
DELETE t1
FROM journal_symptom_tags t1
JOIN journal_symptom_tags t2
  ON t1.label = t2.label AND t1.id > t2.id;

-- Enforce uniqueness on symptom labels
ALTER TABLE journal_symptom_tags
  ADD UNIQUE KEY uq_journal_symptom_label (label);

-- Ensure new global contexts exist
INSERT IGNORE INTO journal_context_tags (label) VALUES
  ('Studii'),
  ('Activitate fizica'),
  ('Calatorie');

-- Ensure extended symptom vocabulary exists
INSERT IGNORE INTO journal_symptom_tags (label) VALUES
  ('Energie ridicata'),
  ('Recunostinta'),
  ('Calm interior'),
  ('Motivatie'),
  ('Conectat cu ceilalti'),
  ('Optimism'),
  ('Neutralitate'),
  ('Atentie'),
  ('Focalizare');

-- Rebuild mood → symptom mappings
DELETE FROM mood_symptom_links;

INSERT INTO mood_symptom_links (mood_id, symptom_id)
SELECT mo.id, tag.id
FROM (
  SELECT 'Minunat' AS mood, 'Energie ridicata' AS tag UNION ALL
  SELECT 'Minunat', 'Recunostinta' UNION ALL
  SELECT 'Minunat', 'Calm interior' UNION ALL
  SELECT 'Minunat', 'Motivatie' UNION ALL
  SELECT 'Minunat', 'Conectat cu ceilalti' UNION ALL
  SELECT 'Minunat', 'Optimism' UNION ALL
  SELECT 'Bine', 'Motivatie' UNION ALL
  SELECT 'Bine', 'Conectat cu ceilalti' UNION ALL
  SELECT 'Bine', 'Optimism' UNION ALL
  SELECT 'Bine', 'Recunostinta' UNION ALL
  SELECT 'Bine', 'Atentie' UNION ALL
  SELECT 'Bine', 'Calm interior' UNION ALL
  SELECT 'OK', 'Neutralitate' UNION ALL
  SELECT 'OK', 'Focalizare' UNION ALL
  SELECT 'OK', 'Atentie' UNION ALL
  SELECT 'OK', 'Motivatie' UNION ALL
  SELECT 'OK', 'Optimism' UNION ALL
  SELECT 'OK', 'Conectat cu ceilalti' UNION ALL
  SELECT 'Ok', 'Neutralitate' UNION ALL
  SELECT 'Ok', 'Focalizare' UNION ALL
  SELECT 'Ok', 'Atentie' UNION ALL
  SELECT 'Ok', 'Motivatie' UNION ALL
  SELECT 'Ok', 'Optimism' UNION ALL
  SELECT 'Ok', 'Conectat cu ceilalti' UNION ALL
  SELECT 'Trist', 'Tristete' UNION ALL
  SELECT 'Trist', 'Anxietate' UNION ALL
  SELECT 'Trist', 'Ganduri intruzive' UNION ALL
  SELECT 'Trist', 'Retragere sociala' UNION ALL
  SELECT 'Trist', 'Lipsa de energie' UNION ALL
  SELECT 'Trist', 'Probleme de somn' UNION ALL
  SELECT 'Suparat', 'Tristete' UNION ALL
  SELECT 'Suparat', 'Iritabilitate' UNION ALL
  SELECT 'Suparat', 'Retragere sociala' UNION ALL
  SELECT 'Suparat', 'Anxietate' UNION ALL
  SELECT 'Suparat', 'Ganduri intruzive' UNION ALL
  SELECT 'Suparat', 'Probleme de somn' UNION ALL
  SELECT 'Obosit', 'Oboseala' UNION ALL
  SELECT 'Obosit', 'Probleme de somn' UNION ALL
  SELECT 'Obosit', 'Lipsa de energie' UNION ALL
  SELECT 'Obosit', 'Dificultati de concentrare' UNION ALL
  SELECT 'Obosit', 'Tristete' UNION ALL
  SELECT 'Obosit', 'Anxietate' UNION ALL
  SELECT 'Dezamagit', 'Tristete' UNION ALL
  SELECT 'Dezamagit', 'Lipsa de energie' UNION ALL
  SELECT 'Dezamagit', 'Ganduri intruzive' UNION ALL
  SELECT 'Dezamagit', 'Retragere sociala' UNION ALL
  SELECT 'Dezamagit', 'Anxietate' UNION ALL
  SELECT 'Dezamagit', 'Dificultati de concentrare' UNION ALL
  SELECT 'Greu', 'Atac de panica' UNION ALL
  SELECT 'Greu', 'Ganduri intruzive' UNION ALL
  SELECT 'Greu', 'Anxietate' UNION ALL
  SELECT 'Greu', 'Dificultati de concentrare' UNION ALL
  SELECT 'Greu', 'Lipsa de energie' UNION ALL
  SELECT 'Greu', 'Probleme de somn'
) AS pairs
JOIN mood_options mo ON mo.label = pairs.mood
JOIN journal_symptom_tags tag ON tag.label = pairs.tag;

COMMIT;
