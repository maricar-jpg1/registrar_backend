const pool = require("../config/db");
const bcrypt = require("bcryptjs");

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const schema = require("fs").readFileSync(
      require("path").join(__dirname, "..", "database.sql"),
      "utf8"
    );

    await client.query(schema);

    const password = await bcrypt.hash("admin123", 10);

    await client.query(
      `INSERT INTO users
       (username, email, password, full_name, role)
       VALUES ($1,$2,$3,$4,$5)`,
      ["admin", "admin@registrar.edu", password, "System Administrator", "admin"]
    );

    const students = [
      ["2026-0001", "Aiko", "M.", "Fujimoto", "2005-03-12", "Female", "aiko@school.edu", "09171234001", "Tokyo St, Manila", "Bachelor of Science in Computer Science", 2, "A", "Active"],
      ["2026-0002", "Riku", null, "Matsuda", "2004-07-22", "Male", "riku@school.edu", "09171234002", "Osaka Ave, QC", "Bachelor of Science in Information Technology", 3, "B", "Active"],
      ["2026-0003", "Hana", "L.", "Sato", "2005-11-05", "Female", "hana@school.edu", "09171234003", "Kyoto Rd, Makati", "Bachelor of Science in Computer Science", 2, "A", "Active"],
      ["2026-0004", "Yuto", "K.", "Tanaka", "2004-01-30", "Male", "yuto@school.edu", "09171234004", "Nara Blvd, Pasig", "Bachelor of Science in Information Technology", 3, "A", "Active"],
      ["2026-0005", "Mei", "P.", "Yamamoto", "2005-09-18", "Female", "mei@school.edu", "09171234005", "Sapporo Lane, Taguig", "Bachelor of Science in Computer Science", 1, "B", "Active"]
    ];

    for (const student of students) {
      await client.query(
        `INSERT INTO students
         (student_id, first_name, middle_name, last_name, date_of_birth,
          gender, email, phone, address, program, year_level, section, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        student
      );
    }

    const faculty = [
      ["FAC-001", "John", "Doe", "john@school.edu", "09180000001", "Computer Science", "Professor", "Software Engineering", "Active"],
      ["FAC-002", "Maria", "Santos", "maria@school.edu", "09180000002", "Information Technology", "Associate Professor", "Networking", "Active"],
      ["FAC-003", "Carlos", "Reyes", "carlos@school.edu", "09180000003", "Computer Science", "Instructor", "Database Systems", "Active"],
      ["FAC-004", "Ana", "Cruz", "ana@school.edu", "09180000004", "Mathematics", "Professor", "Discrete Math", "Active"]
    ];

    for (const row of faculty) {
      await client.query(
        `INSERT INTO faculty
         (faculty_id, first_name, last_name, email, phone, department,
          position, specialization, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        row
      );
    }

    const subjects = [
      ["CS101", "Introduction to Computing", "Fundamentals of computing", 3, "Computer Science", 1, "1st Semester", null, "Active"],
      ["CS102", "Programming 1", "Intro to programming using Python", 3, "Computer Science", 1, "1st Semester", null, "Active"],
      ["CS201", "Data Structures", "Advanced data structures", 3, "Computer Science", 2, "1st Semester", "CS102", "Active"],
      ["CS202", "Database Systems", "Relational databases and SQL", 3, "Computer Science", 2, "2nd Semester", "CS102", "Active"],
      ["IT101", "Web Development", "HTML, CSS, JS basics", 3, "Information Technology", 1, "1st Semester", null, "Active"],
      ["IT201", "Networking Fundamentals", "Network protocols", 3, "Information Technology", 2, "2nd Semester", null, "Active"],
      ["MATH101", "Discrete Mathematics", "Logic, sets, graphs", 3, "Mathematics", 1, "1st Semester", null, "Active"]
    ];

    for (const row of subjects) {
      await client.query(
        `INSERT INTO subjects
         (subject_code, name, description, units, department, year_level,
          semester, prerequisite, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        row
      );
    }

    await client.query(
      `INSERT INTO enrollments
       (enrollment_id, student_id, academic_year, semester, program,
        year_level, section, total_units, status)
       VALUES
       ('ENR-2026-001',1,'2026-2027','1st Semester',
        'Bachelor of Science in Computer Science',2,'A',9,'Enrolled'),
       ('ENR-2026-002',2,'2026-2027','1st Semester',
        'Bachelor of Science in Information Technology',3,'B',6,'Enrolled'),
       ('ENR-2026-003',3,'2026-2027','1st Semester',
        'Bachelor of Science in Computer Science',2,'A',9,'Pending')`
    );

    await client.query(
      `INSERT INTO enrollment_subjects (enrollment_id, subject_id)
       VALUES (1,3),(1,4),(1,7),(2,6)`
    );

    await client.query(
      `INSERT INTO grades
       (student_id, subject_id, faculty_id, semester, academic_year,
        prelim, midterm, final, final_grade, remarks)
       VALUES
       (1,1,1,'1st Semester','2026-2027',85,88,90,87.67,'Passed'),
       (2,5,2,'1st Semester','2026-2027',78,80,82,80.00,'Passed')`
    );

    await client.query(
      `INSERT INTO schedules
       (subject_id, faculty_id, section, room, day, start_time, end_time,
        semester, academic_year)
       VALUES
       (1,1,'A','Room 101','Monday','08:00','10:00','1st Semester','2026-2027'),
       (2,1,'A','Room 102','Tuesday','10:00','12:00','1st Semester','2026-2027'),
       (5,2,'B','Room 201','Wednesday','13:00','15:00','1st Semester','2026-2027')`
    );

    await client.query(
      `INSERT INTO settings (key, value) VALUES
       ('school_name','Registrar University'),
       ('school_address','123 Academic St, Metro Manila'),
       ('registrar_name','System Administrator'),
       ('academic_year','2026-2027'),
       ('current_semester','1st Semester')`
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message) VALUES
       (1,'New Enrollment','A new enrollment is pending approval.'),
       (1,'Grade Submitted','Grades for CS101 have been submitted.')`
    );

    await client.query("COMMIT");

    console.log("Database schema and seed data created successfully.");
    console.log("Login username: admin");
    console.log("Login password: admin123");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
