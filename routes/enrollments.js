const router = require("express").Router();
const controller = require("../controllers/enrollmentsController");
const auth = require("../middleware/auth");
const { required } = require("../middleware/validate");

router.use(auth);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", required(["student_id"]), controller.create);
router.patch("/:id/status", required(["status"]), controller.updateStatus);
router.delete("/:id", controller.remove);

module.exports = router;
