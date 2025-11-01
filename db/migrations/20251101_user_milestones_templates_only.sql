START TRANSACTION;

ALTER TABLE user_milestones
  DROP COLUMN template_key,
  DROP COLUMN title,
  DROP COLUMN description;

COMMIT;
