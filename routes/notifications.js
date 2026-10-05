const router = require("express").Router();
const controller = require("../controllers/notificationsController");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", controller.getMy);
router.patch("/:id/read", controller.markRead);

module.exports = router;
