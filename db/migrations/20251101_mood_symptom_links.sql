START TRANSACTION;

CREATE TABLE IF NOT EXISTS mood_symptom_links (
  mood_id INT NOT NULL,
  symptom_id INT NOT NULL,
  PRIMARY KEY (mood_id, symptom_id),
  FOREIGN KEY (mood_id) REFERENCES mood_options(id) ON DELETE CASCADE,
  FOREIGN KEY (symptom_id) REFERENCES journal_symptom_tags(id) ON DELETE CASCADE
);

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
  SELECT 'Ok', 'Neutralitate' UNION ALL
  SELECT 'Ok', 'Focalizare' UNION ALL
  SELECT 'Ok', 'Atentie' UNION ALL
  SELECT 'Ok', 'Optimism' UNION ALL
  SELECT 'Ok', 'Motivatie' UNION ALL
  SELECT 'Ok', 'Conectat cu ceilalti' UNION ALL
  SELECT 'In regula', 'Neutralitate' UNION ALL
  SELECT 'In regula', 'Focalizare' UNION ALL
  SELECT 'In regula', 'Atentie' UNION ALL
  SELECT 'In regula', 'Calm interior' UNION ALL
  SELECT 'In regula', 'Motivatie' UNION ALL
  SELECT 'In regula', 'Optimism' UNION ALL
  SELECT 'Obosit', 'Oboseala' UNION ALL
  SELECT 'Obosit', 'Probleme de somn' UNION ALL
  SELECT 'Obosit', 'Lipsa de energie' UNION ALL
  SELECT 'Obosit', 'Dificultati de concentrare' UNION ALL
  SELECT 'Obosit', 'Tristete' UNION ALL
  SELECT 'Obosit', 'Anxietate' UNION ALL
  SELECT 'Suparat', 'Tristete' UNION ALL
  SELECT 'Suparat', 'Iritabilitate' UNION ALL
  SELECT 'Suparat', 'Retragere sociala' UNION ALL
  SELECT 'Suparat', 'Anxietate' UNION ALL
  SELECT 'Suparat', 'Ganduri intruzive' UNION ALL
  SELECT 'Suparat', 'Probleme de somn' UNION ALL
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
