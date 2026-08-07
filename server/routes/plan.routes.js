const router = require("express").Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const { createPlan, listPlans, updatePlan, deletePlan } = require("../controllers/plan.controller");

router.use(protect);
router.get("/", listPlans);
router.post("/", authorize("admin"), createPlan);
router.patch("/:id", authorize("admin"), updatePlan);
router.delete("/:id", authorize("admin"), deletePlan);

module.exports = router;
