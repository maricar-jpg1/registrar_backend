const router = require("express").Router();
const controller = require("../controllers/gradesController");
const auth = require("../middleware/auth");
const { required } = require("../middleware/validate");

router.use(auth);

router.get("/", controller.getAll);
router.post(
  "/",
  required(["student_id", "subject_id", "prelim", "midterm", "final"]),
  controller.create
);
router.put(
  "/:id",
  required(["prelim", "midterm", "final"]),
  controller.update
);
router.delete("/:id", controller.remove);

module.exports = router;
