const pool = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const { search = "", status, page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 100);

    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (
        e.enrollment_id ILIKE $${params.length}
        OR s.first_name ILIKE $${params.length}
        OR s.last_name ILIKE $${params.length}
        OR e.program ILIKE $${params.length}
      )`;
    }

    if (status) {
      params.push(status);
      where += ` AND e.status = $${params.length}`;
    }

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       ${where}`,
      params
    );

    const dataParams = [...params, pageSize, (pageNumber - 1) * pageSize];

    const { rows } = await pool.query(
      `SELECT e.*,
              s.first_name || ' ' || s.last_name AS student_name,
              s.student_id
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       ${where}
       ORDER BY e.created_at DESC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      success: true,
      data: rows,
      total: count.rows[0].total,
      page: pageNumber,
      limit: pageSize,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*,
              s.first_name || ' ' || s.last_name AS student_name,
              s.student_id
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    const subjects = await pool.query(
      `SELECT es.id,
              es.subject_id,
              sub.subject_code,
              sub.name AS subject_name,
              sub.units
       FROM enrollment_subjects es
       JOIN subjects sub ON sub.id = es.subject_id
       WHERE es.enrollment_id = $1
       ORDER BY sub.subject_code`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        subjects: subjects.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      student_id,
      academic_year,
      semester,
      program,
      year_level,
      section,
      total_units = 0,
      subject_ids = [],
    } = req.body;

    const studentCheck = await client.query(
      "SELECT id FROM students WHERE id = $1",
      [student_id]
    );

    if (!studentCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Student does not exist",
      });
    }

    const enrollmentId = `ENR-${Date.now()}`;

    const enrollmentResult = await client.query(
      `INSERT INTO enrollments
       (enrollment_id, student_id, academic_year, semester, program,
        year_level, section, total_units, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending')
       RETURNING *`,
      [
        enrollmentId,
        student_id,
        academic_year || null,
        semester || null,
        program || null,
        year_level || null,
        section || null,
        Number(total_units) || 0,
      ]
    );

    const enrollment = enrollmentResult.rows[0];

    if (Array.isArray(subject_ids)) {
      for (const subjectId of subject_ids) {
        await client.query(
          `INSERT INTO enrollment_subjects (enrollment_id, subject_id)
           VALUES ($1, $2)`,
          [enrollment.id, subjectId]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Enrollment created",
      data: enrollment,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ["Pending", "Approved", "Enrolled", "Rejected", "Dropped"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowed.join(", ")}`,
      });
    }

    const { rows } = await pool.query(
      `UPDATE enrollments
       SET status=$1, updated_at=NOW()
       WHERE id=$2
       RETURNING *`,
      [status, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    res.json({
      success: true,
      message: "Enrollment status updated",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM enrollment_subjects WHERE enrollment_id = $1",
      [req.params.id]
    );

    const { rowCount } = await client.query(
      "DELETE FROM enrollments WHERE id = $1",
      [req.params.id]
    );

    await client.query("COMMIT");

    if (!rowCount) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.json({ success: true, message: "Enrollment deleted" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};
