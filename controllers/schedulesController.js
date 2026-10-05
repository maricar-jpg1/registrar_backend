const pool = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sc.*,
              sub.subject_code,
              sub.name AS subject_name,
              f.first_name || ' ' || f.last_name AS faculty_name
       FROM schedules sc
       JOIN subjects sub ON sub.id = sc.subject_id
       LEFT JOIN faculty f ON f.id = sc.faculty_id
       ORDER BY
         CASE sc.day
           WHEN 'Monday' THEN 1
           WHEN 'Tuesday' THEN 2
           WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4
           WHEN 'Friday' THEN 5
           WHEN 'Saturday' THEN 6
           WHEN 'Sunday' THEN 7
           ELSE 8
         END,
         sc.start_time`
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      subject_id,
      faculty_id,
      section,
      room,
      day,
      start_time,
      end_time,
      semester,
      academic_year,
    } = req.body;

    if (!start_time || !end_time || !day) {
      return res.status(400).json({
        success: false,
        message: "Day, start time and end time are required",
      });
    }

    const conflict = await pool.query(
      `SELECT id
       FROM schedules
       WHERE day = $1
         AND (
           (
             faculty_id = $2
             AND (start_time, end_time) OVERLAPS ($3::time, $4::time)
           )
           OR (
             room IS NOT NULL
             AND room = $5
             AND (start_time, end_time) OVERLAPS ($3::time, $4::time)
           )
           OR (
             section IS NOT NULL
             AND section = $6
             AND (start_time, end_time) OVERLAPS ($3::time, $4::time)
           )
         )
       LIMIT 1`,
      [day, faculty_id || null, start_time, end_time, room || null, section || null]
    );

    if (conflict.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Schedule conflict detected",
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO schedules
       (subject_id, faculty_id, section, room, day, start_time, end_time,
        semester, academic_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        subject_id,
        faculty_id || null,
        section || null,
        room || null,
        day,
        start_time,
        end_time,
        semester || null,
        academic_year || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Schedule created",
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
      "DELETE FROM schedules WHERE id = $1",
      [req.params.id]
    );

    if (!rowCount) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    res.json({ success: true, message: "Schedule deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
