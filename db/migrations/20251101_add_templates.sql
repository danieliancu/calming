START TRANSACTION;

ALTER TABLE user_stats
  ADD COLUMN sort_order INT DEFAULT 0 AFTER icon,
  ADD UNIQUE KEY user_stats_user_metric (user_id, metric_key);

CREATE TABLE IF NOT EXISTS milestone_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_key VARCHAR(60) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  category VARCHAR(60) NOT NULL,
  sort_order INT DEFAULT 0
);

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

ALTER TABLE user_milestones
  ADD COLUMN template_key VARCHAR(60) NULL AFTER user_id,
  ADD INDEX user_milestones_template (template_key);

UPDATE user_milestones
SET template_key = CASE
  WHEN title = 'Serie de 30 de zile' THEN 'streak_30'
  WHEN title = 'Prima evaluare emotionala' THEN 'first_assessment'
  WHEN title = 'Membru al comunitatii' THEN 'community_post'
  ELSE NULL
END;

CREATE TABLE IF NOT EXISTS notification_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  audience ENUM('general', 'authenticated') NOT NULL DEFAULT 'general',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(40),
  accent VARCHAR(40),
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sort_order INT DEFAULT 0
);

INSERT INTO notification_templates (audience, title, message, icon, accent, published_at, sort_order)
VALUES
  ('general', 'Descopera ghidul de gestionare a stresului', 'Afla tehnici rapide pentru a reduce tensiunea zilnica.', 'FiBookOpen', 'mint', NOW() - INTERVAL 2 DAY, 10),
  ('general', 'Testeaza evaluarea emotionala', 'Completeaza autoevaluarea gratuita pentru a primi recomandari personalizate.', 'FiActivity', 'teal', NOW() - INTERVAL 3 DAY, 20),
  ('general', 'Webinarii live din aceasta luna', 'Rezerva-ti un loc la discutiile sustinute de specialistii Calming.', 'FiCalendar', 'violet', NOW() - INTERVAL 5 DAY, 30),
  ('general', 'Alatura-te comunitatii Calming', 'Vezi cum te poate sprijini cercul nostru de suport.', 'FiUsers', 'indigo', NOW() - INTERVAL 6 DAY, 40),
  ('general', 'Articole recomandate pentru sezon', 'Colectie de resurse potrivite pentru perioada actuala.', 'FiStar', 'amber', NOW() - INTERVAL 7 DAY, 50),
  ('authenticated', 'Completeaza profilul tau', 'Adauga detalii pentru recomandari mai bune si notificari personalizate.', 'FiUser', 'sky', NOW() - INTERVAL 1 DAY, 10),
  ('authenticated', 'Pastreaza seria zilnica', 'Nu uita sa adaugi intrarea de jurnal pentru astazi.', 'FiHeart', 'rose', NOW() - INTERVAL 12 HOUR, 20),
  ('authenticated', 'Reevaluare emotionala disponibila', 'Este timpul sa refaci evaluarea ghidata pentru a intelege progresul.', 'FiTrendingUp', 'amber', NOW() - INTERVAL 4 DAY, 30),
  ('authenticated', 'Grupul tau are discutii noi', 'Revino in comunitate si continua conversatia.', 'FiMessageCircle', 'indigo', NOW() - INTERVAL 8 HOUR, 40),
  ('authenticated', 'Sloturi noi pentru sedinte', 'Specialistii recomandati au disponibilitate in urmatoarele zile.', 'FiClock', 'violet', NOW() - INTERVAL 2 DAY, 50);

COMMIT;
