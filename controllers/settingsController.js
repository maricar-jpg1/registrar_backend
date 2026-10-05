const pool = require("../config/db");
const bcrypt = require("bcryptjs");

exports.getSettings = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT key, value FROM settings ORDER BY key"
    );

    const settings = {};
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateSettings = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const [key, value] of Object.entries(req.body || {})) {
      await client.query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value`,
        [key, String(value ?? "")]
      );
    }

    await client.query("COMMIT");

    res.json({ success: true, message: "Settings updated" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const result = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const valid = await bcrypt.compare(
      current_password,
      result.rows[0].password
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Current password incorrect",
      });
    }

    const hashed = await bcrypt.hash(new_password, 10);

    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashed, req.user.id]
    );

    res.json({ success: true, message: "Password updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
