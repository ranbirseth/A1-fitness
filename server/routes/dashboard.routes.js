const router = require("express").Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const { getStats } = require("../controllers/dashboard.controller");

router.get("/stats", protect, authorize("admin", "trainer"), getStats);

module.exports = router;
