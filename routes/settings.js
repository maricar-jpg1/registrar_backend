const router = require("express").Router();
const controller = require("../controllers/settingsController");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", controller.getSettings);
router.put("/", controller.updateSettings);
router.put("/password", controller.changePassword);

module.exports = router;
