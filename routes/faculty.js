const router = require("express").Router();
const controller = require("../controllers/facultyController");
const auth = require("../middleware/auth");
const { required } = require("../middleware/validate");

router.use(auth);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", required(["faculty_id", "first_name", "last_name"]), controller.create);
router.put("/:id", required(["faculty_id", "first_name", "last_name"]), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
