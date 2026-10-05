const pool = require("../config/db");

// ==================================================
// GET ALL STUDENTS
// GET /api/students
// ==================================================
exports.getAll = async (req, res) => {
  try {
    const {
      search = "",
      program,
      year_level,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.max(Number(limit) || 10, 1);
    const offset = (currentPage - 1) * pageLimit;

    let query = `
      SELECT *
      FROM students
      WHERE 1 = 1
    `;

    const params = [];

    // Search
    if (search.trim()) {
      params.push(`%${search.trim()}%`);

      query += `
        AND (
          student_id ILIKE $${params.length}
          OR first_name ILIKE $${params.length}
          OR middle_name ILIKE $${params.length}
          OR last_name ILIKE $${params.length}
          OR program ILIKE $${params.length}
        )
      `;
    }

    // Program
    if (program) {
      params.push(program);

      query += `
        AND program = $${params.length}
      `;
    }

    // Year level
    if (year_level) {
      params.push(year_level);

      query += `
        AND year_level = $${params.length}
      `;
    }

    // Status
    if (status) {
      params.push(status);

      query += `
        AND status = $${params.length}
      `;
    }

    query += `
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    params.push(pageLimit);
    params.push(offset);

    const result = await pool.query(query, params);

    // ==================================================
    // COUNT TOTAL RECORDS
    // ==================================================

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM students
      WHERE 1 = 1
    `;

    const countParams = [];

    if (search.trim()) {
      countParams.push(`%${search.trim()}%`);

      countQuery += `
        AND (
          student_id ILIKE $${countParams.length}
          OR first_name ILIKE $${countParams.length}
          OR middle_name ILIKE $${countParams.length}
          OR last_name ILIKE $${countParams.length}
          OR program ILIKE $${countParams.length}
        )
      `;
    }

    if (program) {
      countParams.push(program);

      countQuery += `
        AND program = $${countParams.length}
      `;
    }

    if (year_level) {
      countParams.push(year_level);

      countQuery += `
        AND year_level = $${countParams.length}
      `;
    }

    if (status) {
      countParams.push(status);

      countQuery += `
        AND status = $${countParams.length}
      `;
    }

    const countResult = await pool.query(
      countQuery,
      countParams
    );

    const total = Number(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      total,
      page: currentPage,
      limit: pageLimit,
    });
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve students.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ==================================================
// GET STUDENT BY ID
// GET /api/students/:id
// ==================================================
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM students
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve student.",
    });
  }
};

// ==================================================
// CREATE STUDENT
// POST /api/students
// ==================================================
exports.create = async (req, res) => {
  try {
    const {
      student_id,
      first_name,
      middle_name,
      last_name,
      date_of_birth,
      gender,
      email,
      phone,
      address,
      program,
      year_level,
      section,
      status,
    } = req.body;

    // Required fields
    if (
      !student_id ||
      !student_id.trim() ||
      !first_name ||
      !first_name.trim() ||
      !last_name ||
      !last_name.trim() ||
      !program ||
      !program.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Student ID, first name, last name, and program are required.",
      });
    }

    // Check duplicate Student ID
    const duplicate = await pool.query(
      `
      SELECT id
      FROM students
      WHERE student_id = $1
      `,
      [student_id.trim()]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Student ID already exists.",
      });
    }

    // Insert student
    const result = await pool.query(
      `
      INSERT INTO students (
        student_id,
        first_name,
        middle_name,
        last_name,
        date_of_birth,
        gender,
        email,
        phone,
        address,
        program,
        year_level,
        section,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13
      )
      RETURNING *
      `,
      [
        student_id.trim(),
        first_name.trim(),
        middle_name
          ? middle_name.trim()
          : null,
        last_name.trim(),
        date_of_birth || null,
        gender || null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        program.trim(),
        year_level
          ? Number(year_level)
          : null,
        section ? section.trim() : null,
        status || "Active",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Student created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);

    // PostgreSQL duplicate error
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Student ID already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create student.",
    });
  }
};

// ==================================================
// UPDATE STUDENT
// PUT /api/students/:id
// ==================================================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      student_id,
      first_name,
      middle_name,
      last_name,
      date_of_birth,
      gender,
      email,
      phone,
      address,
      program,
      year_level,
      section,
      status,
    } = req.body;

    // Required fields
    if (
      !student_id ||
      !student_id.trim() ||
      !first_name ||
      !first_name.trim() ||
      !last_name ||
      !last_name.trim() ||
      !program ||
      !program.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Student ID, first name, last name, and program are required.",
      });
    }

    // Check if another student uses this Student ID
    const duplicate = await pool.query(
      `
      SELECT id
      FROM students
      WHERE student_id = $1
      AND id <> $2
      `,
      [student_id.trim(), id]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Student ID already belongs to another student.",
      });
    }

    const result = await pool.query(
      `
      UPDATE students
      SET
        student_id = $1,
        first_name = $2,
        middle_name = $3,
        last_name = $4,
        date_of_birth = $5,
        gender = $6,
        email = $7,
        phone = $8,
        address = $9,
        program = $10,
        year_level = $11,
        section = $12,
        status = $13,
        updated_at = NOW()
      WHERE id = $14
      RETURNING *
      `,
      [
        student_id.trim(),
        first_name.trim(),
        middle_name
          ? middle_name.trim()
          : null,
        last_name.trim(),
        date_of_birth || null,
        gender || null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        program.trim(),
        year_level
          ? Number(year_level)
          : null,
        section ? section.trim() : null,
        status || "Active",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.json({
      success: true,
      message: "Student updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE STUDENT ERROR:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Student ID already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update student.",
    });
  }
};

// ==================================================
// DELETE STUDENT
// DELETE /api/students/:id
// ==================================================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM students
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.json({
      success: true,
      message: "Student deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE STUDENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete student.",
    });
  }
};