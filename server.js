const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: false,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Registrar Management System API is running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      success: true,
      message: "API and PostgreSQL connection are working",
      server_time: new Date().toISOString(),
      database_time: result.rows[0].database_time,
    });
  } catch (error) {
    console.error("Health check database error:", error);
    res.status(503).json({
      success: false,
      message: "API is running, but PostgreSQL connection failed",
      error: error.message,
    });
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/students", require("./routes/students"));
app.use("/api/faculty", require("./routes/faculty"));
app.use("/api/subjects", require("./routes/subjects"));
app.use("/api/enrollments", require("./routes/enrollments"));
app.use("/api/grades", require("./routes/grades"));
app.use("/api/schedules", require("./routes/schedules"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/notifications", require("./routes/notifications"));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server error",
  });
});

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected.");
    app.listen(PORT, () => {
      console.log(`Registrar API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Could not connect to PostgreSQL.");
    console.error(error.message);
    process.exit(1);
  }
}

start();
