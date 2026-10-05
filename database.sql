-- Registrar Management System
-- PostgreSQL database schema
-- Create the database first:
-- CREATE DATABASE registrar_system;
--
-- Then connect to registrar_system and run this file.

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS enrollment_subjects CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(150),
  role VARCHAR(30) NOT NULL DEFAULT 'registrar',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(30) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  email VARCHAR(100),
  phone VARCHAR(30),
  address TEXT,
  program VARCHAR(150),
  year_level INTEGER CHECK (year_level IS NULL OR year_level > 0),
  section VARCHAR(30),
  status VARCHAR(30) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE faculty (
  id SERIAL PRIMARY KEY,
  faculty_id VARCHAR(30) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(30),
  department VARCHAR(100),
  position VARCHAR(100),
  specialization VARCHAR(150),
  status VARCHAR(30) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  subject_code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  units INTEGER NOT NULL CHECK (units > 0),
  department VARCHAR(100),
  year_level INTEGER,
  semester VARCHAR(30),
  prerequisite VARCHAR(50),
  status VARCHAR(30) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  enrollment_id VARCHAR(50) UNIQUE NOT NULL,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year VARCHAR(20),
  semester VARCHAR(30),
  program VARCHAR(150),
  year_level INTEGER,
  section VARCHAR(30),
  total_units INTEGER NOT NULL DEFAULT 0 CHECK (total_units >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE enrollment_subjects (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (enrollment_id, subject_id)
);

CREATE TABLE grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
  semester VARCHAR(30),
  academic_year VARCHAR(20),
  prelim NUMERIC(5,2) CHECK (prelim IS NULL OR prelim BETWEEN 0 AND 100),
  midterm NUMERIC(5,2) CHECK (midterm IS NULL OR midterm BETWEEN 0 AND 100),
  final NUMERIC(5,2) CHECK (final IS NULL OR final BETWEEN 0 AND 100),
  final_grade NUMERIC(5,2) CHECK (final_grade IS NULL OR final_grade BETWEEN 0 AND 100),
  remarks VARCHAR(30),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
  section VARCHAR(30),
  room VARCHAR(50),
  day VARCHAR(20),
  start_time TIME,
  end_time TIME,
  semester VARCHAR(30),
  academic_year VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
);

CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_program ON students(program);
CREATE INDEX idx_faculty_department ON faculty(department);
CREATE INDEX idx_subjects_department ON subjects(department);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_schedules_day ON schedules(day);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Default login:
-- username: admin
-- password: admin123
-- The password is inserted by seed/seed.js using bcrypt.
