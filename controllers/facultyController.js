const pool = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const { search = "", department, status, page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 100);

    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (
        faculty_id ILIKE $${params.length}
        OR first_name ILIKE $${params.length}
        OR last_name ILIKE $${params.length}
        OR department ILIKE $${params.length}
      )`;
    }

    if (department) {
      params.push(department);
      where += ` AND department = $${params.length}`;
    }

    if (status) {
      params.push(status);
      where += ` AND status = $${params.length}`;
    }

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM faculty ${where}`,
      params
    );

    const dataParams = [...params, pageSize, (pageNumber - 1) * pageSize];

    const { rows } = await pool.query(
      `SELECT *
       FROM faculty
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

exports.getById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM faculty WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      faculty_id, first_name, last_name, email, phone,
      department, position, specialization, status = "Active",
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO faculty
       (faculty_id, first_name, last_name, email, phone, department,
        position, specialization, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        faculty_id, first_name, last_name, email || null, phone || null,
        department || null, position || null, specialization || null, status,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Faculty created",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Faculty ID already exists",
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      faculty_id, first_name, last_name, email, phone,
      department, position, specialization, status,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE faculty
       SET faculty_id=$1, first_name=$2, last_name=$3, email=$4, phone=$5,
           department=$6, position=$7, specialization=$8, status=$9,
           updated_at=NOW()
       WHERE id=$10
       RETURNING *`,
      [
        faculty_id, first_name, last_name, email || null, phone || null,
        department || null, position || null, specialization || null,
        status || "Active", req.params.id,
      ]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    res.json({
      success: true,
      message: "Faculty updated",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Faculty ID already exists",
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM faculty WHERE id = $1",
      [req.params.id]
    );

    if (!rowCount) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    res.json({ success: true, message: "Faculty deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
