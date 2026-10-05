const pool = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const { search = "", department, year_level, semester, page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 100);

    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (
        subject_code ILIKE $${params.length}
        OR name ILIKE $${params.length}
      )`;
    }
    if (department) {
      params.push(department);
      where += ` AND department = $${params.length}`;
    }
    if (year_level) {
      params.push(Number(year_level));
      where += ` AND year_level = $${params.length}`;
    }
    if (semester) {
      params.push(semester);
      where += ` AND semester = $${params.length}`;
    }

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM subjects ${where}`,
      params
    );

    const dataParams = [...params, pageSize, (pageNumber - 1) * pageSize];

    const { rows } = await pool.query(
      `SELECT *
       FROM subjects
       ${where}
       ORDER BY created_at DESC
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

exports.create = async (req, res) => {
  try {
    const {
      subject_code, name, description, units, department,
      year_level, semester, prerequisite, status = "Active",
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO subjects
       (subject_code, name, description, units, department, year_level,
        semester, prerequisite, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        subject_code, name, description || null, Number(units),
        department || null, year_level || null, semester || null,
        prerequisite || null, status,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Subject created",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      subject_code, name, description, units, department,
      year_level, semester, prerequisite, status,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE subjects
       SET subject_code=$1, name=$2, description=$3, units=$4,
           department=$5, year_level=$6, semester=$7,
           prerequisite=$8, status=$9, updated_at=NOW()
       WHERE id=$10
       RETURNING *`,
      [
        subject_code, name, description || null, Number(units),
        department || null, year_level || null, semester || null,
        prerequisite || null, status || "Active", req.params.id,
      ]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    res.json({
      success: true,
      message: "Subject updated",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM subjects WHERE id = $1",
      [req.params.id]
    );
    if (!rowCount) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    res.json({ success: true, message: "Subject deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
