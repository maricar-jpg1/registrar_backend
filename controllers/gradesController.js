const pool = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const {
      student_id,
      subject_id,
      semester,
      academic_year,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);

    let where = "WHERE 1=1";
    const params = [];

    if (student_id) {
      params.push(Number(student_id));
      where += ` AND g.student_id = $${params.length}`;
    }
    if (subject_id) {
      params.push(Number(subject_id));
      where += ` AND g.subject_id = $${params.length}`;
    }
    if (semester) {
      params.push(semester);
      where += ` AND g.semester = $${params.length}`;
    }
    if (academic_year) {
      params.push(academic_year);
      where += ` AND g.academic_year = $${params.length}`;
    }

    const dataParams = [...params, pageSize, (pageNumber - 1) * pageSize];

    const { rows } = await pool.query(
      `SELECT g.*,
              s.first_name || ' ' || s.last_name AS student_name,
              s.student_id,
              sub.subject_code,
              sub.name AS subject_name,
              f.first_name || ' ' || f.last_name AS faculty_name
       FROM grades g
       JOIN students s ON s.id = g.student_id
       JOIN subjects sub ON sub.id = g.subject_id
       LEFT JOIN faculty f ON f.id = g.faculty_id
       ${where}
       ORDER BY g.created_at DESC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

function calculateGrade(prelim, midterm, final) {
  const values = [prelim, midterm, final].map(Number);
  if (values.some((v) => Number.isNaN(v))) return null;
  return Number(((values[0] + values[1] + values[2]) / 3).toFixed(2));
}

exports.create = async (req, res) => {
  try {
    const {
      student_id,
      subject_id,
      faculty_id,
      semester,
      academic_year,
      prelim,
      midterm,
      final,
    } = req.body;

    const finalGrade = calculateGrade(prelim, midterm, final);

    if (finalGrade === null) {
      return res.status(400).json({
        success: false,
        message: "Prelim, midterm and final grades must be valid numbers",
      });
    }

    const remarks = finalGrade >= 75 ? "Passed" : "Failed";

    const { rows } = await pool.query(
      `INSERT INTO grades
       (student_id, subject_id, faculty_id, semester, academic_year,
        prelim, midterm, final, final_grade, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        student_id,
        subject_id,
        faculty_id || null,
        semester || null,
        academic_year || null,
        prelim,
        midterm,
        final,
        finalGrade,
        remarks,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Grade saved",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { prelim, midterm, final } = req.body;
    const finalGrade = calculateGrade(prelim, midterm, final);

    if (finalGrade === null) {
      return res.status(400).json({
        success: false,
        message: "Prelim, midterm and final grades must be valid numbers",
      });
    }

    const remarks = finalGrade >= 75 ? "Passed" : "Failed";

    const { rows } = await pool.query(
      `UPDATE grades
       SET prelim=$1, midterm=$2, final=$3, final_grade=$4,
           remarks=$5, updated_at=NOW()
       WHERE id=$6
       RETURNING *`,
      [prelim, midterm, final, finalGrade, remarks, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Grade not found" });
    }

    res.json({
      success: true,
      message: "Grade updated",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM grades WHERE id = $1",
      [req.params.id]
    );

    if (!rowCount) {
      return res.status(404).json({ success: false, message: "Grade not found" });
    }

    res.json({ success: true, message: "Grade deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
