const WorkoutPlan = require("../models/workout.model");
const Member = require("../models/member.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { AppError } = require("../utils/appError");

// Templates CRUD
const createWorkoutTemplate = asyncHandler(async (req, res) => {
  const workout = await WorkoutPlan.create({
    ...req.body,
    gymId: req.gymId,
    createdBy: req.user._id,
    isTemplate: true
  });
  sendResponse(res, { status: 201, message: "Workout template created", data: workout });
});

const getWorkoutTemplates = asyncHandler(async (req, res) => {
  const templates = await WorkoutPlan.find({ gymId: req.gymId, isTemplate: true });
  sendResponse(res, { message: "Templates fetched", data: templates });
});

const deleteWorkoutPlan = asyncHandler(async (req, res) => {
  await WorkoutPlan.findOneAndDelete({ _id: req.params.id, gymId: req.gymId });
  sendResponse(res, { message: "Workout plan deleted" });
});

// Assignment
const assignWorkoutToMember = asyncHandler(async (req, res) => {
  const { memberId, templateId, customPlan } = req.body;
  if (!templateId && !customPlan) {
    throw new AppError("Either templateId or customPlan must be provided", 400);
  }
  
  const member = await Member.findOne({ _id: memberId, gymId: req.gymId });
  if (!member) throw new AppError("Member not found", 404);

  let workoutPlan;
  if (templateId) {
    const template = await WorkoutPlan.findOne({ _id: templateId, gymId: req.gymId });
    if (!template) throw new AppError("Template not found", 404);
    
    // Create a copy for the member
    const templateObj = template.toObject();
    workoutPlan = await WorkoutPlan.create({
      gymId: req.gymId,
      name: templateObj.name,
      goal: templateObj.goal,
      difficulty: templateObj.difficulty,
      days: JSON.parse(JSON.stringify(templateObj.days)),
      isTemplate: false,
      assignedTo: memberId,
      createdBy: req.user._id
    });
  } else if (customPlan) {
    workoutPlan = await WorkoutPlan.create({
      ...customPlan,
      gymId: req.gymId,
      isTemplate: false,
      assignedTo: memberId,
      createdBy: req.user._id
    });
  }

  if (!workoutPlan) throw new AppError("Failed to create workout plan", 500);
  
  member.assignedWorkout = workoutPlan._id;
  await member.save();
  
  // Populate the created workout before sending response
  await workoutPlan.populate("createdBy", "name email");
  sendResponse(res, { message: "Workout assigned successfully", data: workoutPlan });
});

const getMemberWorkout = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ user: req.user._id }).populate("assignedWorkout");
  if (!member) throw new AppError("Member profile not found", 404);
  sendResponse(res, { message: "Workout fetched", data: member.assignedWorkout });
});

module.exports = {
  createWorkoutTemplate,
  getWorkoutTemplates,
  deleteWorkoutPlan,
  assignWorkoutToMember,
  getMemberWorkout
};
