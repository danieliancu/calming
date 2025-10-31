DROP DATABASE IF EXISTS calming_app;
CREATE DATABASE calming_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE calming_app;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  city VARCHAR(80),
  country VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY,
  display_name VARCHAR(120) NOT NULL,
  member_since DATE,
  avatar_initials VARCHAR(5),
  profile_completion TINYINT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  metric_key VARCHAR(50) NOT NULL,
  label VARCHAR(120) NOT NULL,
  value VARCHAR(60) NOT NULL,
  tone VARCHAR(20),
  icon VARCHAR(40),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  achieved_at DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_info_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  label VARCHAR(150) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE mood_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(50) NOT NULL,
  emoji VARCHAR(10) NOT NULL
);

CREATE TABLE faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(255) NOT NULL,
  answer TEXT NOT NULL,
  link_href VARCHAR(255),
  link_text VARCHAR(255),
  link_hint VARCHAR(255)
);

CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  tag VARCHAR(60),
  minutes INT,
  hero_image VARCHAR(255),
  author VARCHAR(120),
  body LONGTEXT,
  is_recommended TINYINT(1) DEFAULT 0
);

CREATE TABLE article_topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  article_count INT DEFAULT 0
);

CREATE TABLE related_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  related_article_id INT NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (related_article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE community_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  members INT DEFAULT 0,
  last_active VARCHAR(60),
  is_private TINYINT(1) DEFAULT 1
);

CREATE TABLE psychologists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  specialty VARCHAR(150) NOT NULL,
  rating DECIMAL(2,1) DEFAULT 5.0,
  distance_km DECIMAL(5,1)
);

CREATE TABLE appointment_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(120) NOT NULL
);

CREATE TABLE appointment_time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot VARCHAR(10) NOT NULL
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(40),
  accent VARCHAR(40),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE journal_context_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

CREATE TABLE journal_symptom_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(100) NOT NULL
);

CREATE TABLE journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mood_id INT,
  intensity TINYINT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mood_id) REFERENCES mood_options(id) ON DELETE SET NULL
);

CREATE TABLE journal_entry_contexts (
  entry_id INT NOT NULL,
  context_id INT NOT NULL,
  PRIMARY KEY (entry_id, context_id),
  FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (context_id) REFERENCES journal_context_tags(id) ON DELETE CASCADE
);

CREATE TABLE journal_entry_symptoms (
  entry_id INT NOT NULL,
  symptom_id INT NOT NULL,
  PRIMARY KEY (entry_id, symptom_id),
  FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (symptom_id) REFERENCES journal_symptom_tags(id) ON DELETE CASCADE
);

CREATE TABLE journal_quick_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mood_id INT NOT NULL,
  notes VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mood_id) REFERENCES mood_options(id) ON DELETE CASCADE
);
