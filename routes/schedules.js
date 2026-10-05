const router = require("express").Router();
const controller = require("../controllers/schedulesController");
const auth = require("../middleware/auth");
const { required } = require("../middleware/validate");

router.use(auth);

router.get("/", controller.getAll);
router.post(
  "/",
  required(["subject_id", "day", "start_time", "end_time"]),
  controller.create
);
router.delete("/:id", controller.remove);

module.exports = router;
