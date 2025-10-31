UPDATE mood_options
SET emoji = '😊'
WHERE label = 'Minunat';

UPDATE mood_options
SET emoji = '🙂'
WHERE label = 'Bine';

UPDATE mood_options
SET label = 'In regula',
    emoji = '😌'
WHERE label IN ('Ok', 'In regula');

UPDATE mood_options
SET emoji = '😔'
WHERE label = 'Greu';

UPDATE mood_options
SET emoji = '😴'
WHERE label = 'Obosit';

INSERT INTO mood_options (label, emoji)
SELECT 'Suparat', '😞'
WHERE NOT EXISTS (
  SELECT 1 FROM mood_options WHERE label = 'Suparat'
);
