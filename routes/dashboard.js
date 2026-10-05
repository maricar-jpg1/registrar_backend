const router = require("express").Router();
const controller = require("../controllers/dashboardController");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/stats", controller.getStats);
router.get("/recent-students", controller.getRecentStudents);
router.get("/recent-enrollments", controller.getRecentEnrollments);
router.get("/today-schedule", controller.getTodaySchedule);

module.exports = router;
