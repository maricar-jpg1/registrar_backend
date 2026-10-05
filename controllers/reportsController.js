const pool = require("../config/db");

exports.generate = async (req, res) => {
  try {
    const { type, academic_year, semester, program, year_level } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Report type is required",
      });
    }

    let data = [];
    let summary = {};

    if (type === "students") {
      let q = "SELECT * FROM students WHERE 1=1";
      const p = [];

      if (program) {
        p.push(program);
        q += ` AND program = $${p.length}`;
      }
      if (year_level) {
        p.push(Number(year_level));
        q += ` AND year_level = $${p.length}`;
      }

      const result = await pool.query(q, p);
      data = result.rows;
      summary = { total: data.length };
    }

    else if (type === "faculty") {
      const result = await pool.query(
        "SELECT * FROM faculty ORDER BY created_at DESC"
      );
      data = result.rows;
      summary = { total: data.length };
    }

    else if (type === "enrollments") {
      let q = `SELECT e.*,
                      s.first_name || ' ' || s.last_name AS student_name,
                      s.student_id
               FROM enrollments e
               JOIN students s ON s.id = e.student_id
               WHERE 1=1`;
      const p = [];

      if (academic_year) {
        p.push(academic_year);
        q += ` AND e.academic_year = $${p.length}`;
      }
      if (semester) {
        p.push(semester);
        q += ` AND e.semester = $${p.length}`;
      }

      const result = await pool.query(q, p);
      data = result.rows;
      summary = { total: data.length };
    }

    else if (type === "subjects") {
      const result = await pool.query(
        "SELECT * FROM subjects ORDER BY subject_code"
      );
      data = result.rows;
      summary = {
        total: data.length,
        total_units: data.reduce((sum, item) => sum + Number(item.units || 0), 0),
      };
    }

    else if (type === "grades") {
      let q = `SELECT g.*,
                      s.first_name || ' ' || s.last_name AS student_name,
                      s.student_id,
                      sub.subject_code,
                      sub.name AS subject_name
               FROM grades g
               JOIN students s ON s.id = g.student_id
               JOIN subjects sub ON sub.id = g.subject_id
               WHERE 1=1`;
      const p = [];

      if (semester) {
        p.push(semester);
        q += ` AND g.semester = $${p.length}`;
      }
      if (academic_year) {
        p.push(academic_year);
        q += ` AND g.academic_year = $${p.length}`;
      }

      const result = await pool.query(q, p);
      data = result.rows;

      const passed = data.filter((item) => item.remarks === "Passed").length;

      summary = {
        total: data.length,
        passed,
        failed: data.length - passed,
      };
    }

    else if (type === "schedules") {
      const result = await pool.query(
        `SELECT sc.*,
                sub.subject_code,
                sub.name AS subject_name,
                f.first_name || ' ' || f.last_name AS faculty_name
         FROM schedules sc
         JOIN subjects sub ON sub.id = sc.subject_id
         LEFT JOIN faculty f ON f.id = sc.faculty_id
         ORDER BY sc.day, sc.start_time`
      );
      data = result.rows;
      summary = { total: data.length };
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Unsupported report type",
      });
    }

    res.json({
      success: true,
      data,
      summary,
      type,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
