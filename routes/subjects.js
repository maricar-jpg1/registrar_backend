const router = require("express").Router();
const controller = require("../controllers/subjectsController");
const auth = require("../middleware/auth");
const { required } = require("../middleware/validate");

router.use(auth);

router.get("/", controller.getAll);
router.post("/", required(["subject_code", "name", "units"]), controller.create);
router.put("/:id", required(["subject_code", "name", "units"]), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
