ALTER TABLE user_profiles
  ADD COLUMN community_alias VARCHAR(80) DEFAULT NULL AFTER profile_completion;

CREATE TABLE IF NOT EXISTS user_profile_details (
  user_id INT PRIMARY KEY,
  age_range VARCHAR(32),
  focus_topics TEXT,
  primary_goal TEXT,
  stress_triggers TEXT,
  coping_strategies TEXT,
  guidance_style VARCHAR(40),
  check_in_preference VARCHAR(40),
  therapy_status VARCHAR(40),
  notification_frequency VARCHAR(40),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

UPDATE user_profiles
SET community_alias = COALESCE(community_alias, display_name)
WHERE community_alias IS NULL;

