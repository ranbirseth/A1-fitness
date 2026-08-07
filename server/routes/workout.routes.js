const router = require("express").Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  createWorkoutTemplate,
  getWorkoutTemplates,
  deleteWorkoutPlan,
  assignWorkoutToMember,
  getMemberWorkout
} = require("../controllers/workout.controller");

router.use(protect);

// Member routes
router.get("/my-workout", authorize("member"), getMemberWorkout);

// Admin/Trainer routes
router.get("/templates", authorize("view_workout"), getWorkoutTemplates);
router.post("/templates", authorize("create_workout"), createWorkoutTemplate);
router.delete("/:id", authorize("delete_workout"), deleteWorkoutPlan);
router.post("/assign", authorize("assign_workout"), assignWorkoutToMember);

module.exports = router;
