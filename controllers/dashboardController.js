const pool = require("../config/db");

exports.getStats = async (req, res) => {
  try {
    const [students, faculty, subjects, active, pending, classes] =
      await Promise.all([
        pool.query("SELECT COUNT(*)::int AS count FROM students"),
        pool.query("SELECT COUNT(*)::int AS count FROM faculty"),
        pool.query("SELECT COUNT(*)::int AS count FROM subjects"),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM enrollments
           WHERE status IN ('Approved', 'Enrolled')`
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM enrollments
           WHERE status = 'Pending'`
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM schedules
           WHERE day = TRIM(TO_CHAR(CURRENT_DATE, 'Day'))`
        ),
      ]);

    res.json({
      success: true,
      data: {
        totalStudents: students.rows[0].count,
        totalFaculty: faculty.rows[0].count,
        totalSubjects: subjects.rows[0].count,
        activeEnrollments: active.rows[0].count,
        pendingEnrollments: pending.rows[0].count,
        classesToday: classes.rows[0].count,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getRecentStudents = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM students ORDER BY created_at DESC LIMIT 5"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getRecentEnrollments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*,
              s.first_name || ' ' || s.last_name AS student_name
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       ORDER BY e.created_at DESC
       LIMIT 5`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getTodaySchedule = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sc.*,
              sub.subject_code,
              sub.name AS subject_name,
              f.first_name || ' ' || f.last_name AS faculty_name
       FROM schedules sc
       JOIN subjects sub ON sub.id = sc.subject_id
       LEFT JOIN faculty f ON f.id = sc.faculty_id
       WHERE sc.day = TRIM(TO_CHAR(CURRENT_DATE, 'Day'))
       ORDER BY sc.start_time`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
