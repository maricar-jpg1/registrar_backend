const router = require("express").Router();
const controller = require("../controllers/reportsController");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/generate", controller.generate);

module.exports = router;
