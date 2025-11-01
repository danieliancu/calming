START TRANSACTION;

-- Rename existing notifications table for consistency.
RENAME TABLE notifications TO user_notifications;

ALTER TABLE notification_templates
  ADD UNIQUE KEY notification_templates_audience_title (audience, title);

-- Allow overriding values but prefer templates.
ALTER TABLE user_notifications
  ADD COLUMN template_id INT NULL AFTER user_id,
  MODIFY title VARCHAR(200) NULL,
  MODIFY message TEXT NULL,
  MODIFY icon VARCHAR(40) NULL,
  MODIFY accent VARCHAR(40) NULL;

-- Ensure templates exist for legacy personal notifications.
INSERT INTO notification_templates (audience, title, message, icon, accent, published_at, sort_order)
VALUES
  ('authenticated', 'Reminder autoexaminare', 'Este momentul pentru autoexaminarea lunara.', 'FiCalendar', 'rose', NOW() - INTERVAL 4 DAY, 60),
  ('authenticated', 'Asistent AI', 'Am pregatit recomandari personalizate pentru tine.', 'FiMessageCircle', 'violet', NOW() - INTERVAL 5 HOUR, 70),
  ('authenticated', 'Actualizare comunitate', 'Postare noua in Cercul zilnic de sprijin.', 'FiUsers', 'white', NOW() - INTERVAL 1 DAY, 80),
  ('authenticated', 'Articol nou', 'Intelege mai bine cum poti gestiona starile dificile.', 'FiBookOpen', 'white', NOW() - INTERVAL 2 DAY, 90),
  ('authenticated', 'Reminder programare', 'Sedinta ta este programata pe 25 octombrie la ora 10:00.', 'FiClock', 'white', NOW() - INTERVAL 3 DAY, 100),
  ('authenticated', 'Verificare zilnica', 'Cum te simti astazi? Ia un moment sa notezi in jurnal.', 'FiHeart', 'white', NOW() - INTERVAL 7 DAY, 110),
  ('authenticated', 'Verificare rapida', 'Cum te simti astazi? Deschide jurnalul si noteaza cateva ganduri.', 'FiHeart', 'rose', NOW() - INTERVAL 2 HOUR, 120)
ON DUPLICATE KEY UPDATE
  message = VALUES(message),
  icon = VALUES(icon),
  accent = VALUES(accent),
  published_at = VALUES(published_at),
  sort_order = VALUES(sort_order);

-- Link existing user notifications to templates.
UPDATE user_notifications un
JOIN notification_templates nt ON nt.title = un.title
SET un.template_id = nt.id
WHERE un.template_id IS NULL;

ALTER TABLE user_notifications
  ADD CONSTRAINT fk_user_notifications_template
    FOREIGN KEY (template_id) REFERENCES notification_templates(id)
    ON DELETE SET NULL;

ALTER TABLE user_notifications
  MODIFY template_id INT NOT NULL;

-- Ensure milestone data references templates directly.
ALTER TABLE user_milestones
  ADD COLUMN template_id INT NULL AFTER user_id,
  MODIFY title VARCHAR(150) NULL,
  MODIFY description VARCHAR(255) NULL;

UPDATE user_milestones um
LEFT JOIN milestone_templates mt ON mt.template_key = um.template_key
SET um.template_id = mt.id
WHERE um.template_id IS NULL;

ALTER TABLE user_milestones
  ADD CONSTRAINT fk_user_milestones_template
    FOREIGN KEY (template_id) REFERENCES milestone_templates(id)
    ON DELETE SET NULL;

ALTER TABLE user_milestones
  MODIFY template_id INT NOT NULL;

COMMIT;
