-- Tables for CounselMate. Safe to run more than once (nothing is dropped).

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(60)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS colleges (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  city        VARCHAR(60)  NOT NULL,
  state       VARCHAR(60)  NOT NULL,
  type        ENUM('Government','Private','Autonomous') NOT NULL,
  fees        INT          NOT NULL,                 -- rupees per year
  cutoff      DECIMAL(5,2) NOT NULL,                 -- last year's closing percentile, 0 to 100
  rating      DECIMAL(2,1) NOT NULL DEFAULT 0,       -- 0 to 5
  established SMALLINT     NULL,
  website     VARCHAR(200) NULL,
  description TEXT         NOT NULL,
  is_sample   BOOLEAN      NOT NULL DEFAULT FALSE,   -- TRUE = made-up demo data
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_fees   CHECK (fees BETWEEN 0 AND 5000000),
  CONSTRAINT chk_cutoff CHECK (cutoff BETWEEN 0 AND 100),
  CONSTRAINT chk_rating CHECK (rating BETWEEN 0 AND 5),
  INDEX idx_city_type (city, type),
  INDEX idx_fees (fees),
  INDEX idx_rating (rating)
);

-- One row per course a college offers (a college has many courses).
CREATE TABLE IF NOT EXISTS college_courses (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT         NOT NULL,
  course     VARCHAR(60) NOT NULL,
  UNIQUE KEY uq_college_course (college_id, course),
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Which student saved which college (many-to-many).
CREATE TABLE IF NOT EXISTS shortlist (
  user_id    INT NOT NULL,
  college_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, college_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guidance (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  category   ENUM('documents','steps','deadlines','faq') NOT NULL,
  title      VARCHAR(120) NOT NULL,
  note       VARCHAR(400) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS guidance_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  guidance_id INT NOT NULL,
  item_order  INT NOT NULL,
  item_text   VARCHAR(500) NOT NULL,
  FOREIGN KEY (guidance_id) REFERENCES guidance(id) ON DELETE CASCADE
);
