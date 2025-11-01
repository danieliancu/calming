START TRANSACTION;

CREATE TABLE IF NOT EXISTS resource_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_key VARCHAR(60) NOT NULL UNIQUE,
  label VARCHAR(150) NOT NULL,
  sort_order INT DEFAULT 0
);

INSERT INTO resource_templates (template_key, label, sort_order)
VALUES
  ('about_you', 'Despre tine', 10),
  ('emotional_history', 'Istoric emotional', 20),
  ('scheduled_sessions', 'Sesiuni programate', 30),
  ('ongoing_treatment', 'Tratament in curs', 40)
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  sort_order = VALUES(sort_order);

ALTER TABLE user_info_links
  ADD COLUMN template_id INT NULL AFTER user_id,
  MODIFY label VARCHAR(150) NULL;

UPDATE user_info_links ui
JOIN resource_templates rt ON rt.label = ui.label
SET ui.template_id = rt.id
WHERE ui.template_id IS NULL;

ALTER TABLE user_info_links
  MODIFY template_id INT NOT NULL,
  ADD CONSTRAINT fk_user_info_links_template
    FOREIGN KEY (template_id) REFERENCES resource_templates(id)
    ON DELETE RESTRICT;

COMMIT;
