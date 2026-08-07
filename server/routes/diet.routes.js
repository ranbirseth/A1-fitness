const router = require("express").Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  createDietTemplate,
  getDietTemplates,
  deleteDietPlan,
  assignDietToMember,
  getMemberDiet
} = require("../controllers/diet.controller");

router.use(protect);

// Member routes
router.get("/my-diet", authorize("member"), getMemberDiet);

// Admin/Trainer routes
router.get("/templates", authorize("view_diet"), getDietTemplates);
router.post("/templates", authorize("create_diet"), createDietTemplate);
router.delete("/:id", authorize("delete_diet"), deleteDietPlan);
router.post("/assign", authorize("assign_diet"), assignDietToMember);

module.exports = router;
