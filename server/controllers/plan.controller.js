const Plan = require("../models/plan.model");
const Member = require("../models/member.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

const createPlan = asyncHandler(async (req, res) => {
  const { name, price, duration, features } = req.body;
  if (!name || price === undefined || !duration) {
    throw Object.assign(new Error("Missing required fields"), { statusCode: 400 });
  }
  if (price < 0 || duration < 1) {
    throw Object.assign(new Error("Invalid values for price or duration"), { statusCode: 400 });
  }
  const plan = await Plan.create({ gymId: req.gymId, name, price, duration, features });
  sendResponse(res, { status: 201, message: "Plan created", data: plan });
});

const listPlans = asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPagination(req.query);
  const query = { gymId: req.gymId };
  if (req.query.search) query.name = new RegExp(req.query.search, "i");
  const [items, total] = await Promise.all([
    Plan.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Plan.countDocuments(query)
  ]);
  sendResponse(res, { message: "Plans fetched", data: { items, total, page, limit } });
});

const updatePlan = asyncHandler(async (req, res) => {
  const { name, price, duration, features } = req.body;
  if (price !== undefined && price < 0) throw Object.assign(new Error("Price cannot be negative"), { statusCode: 400 });
  if (duration !== undefined && duration < 1) throw Object.assign(new Error("Duration must be at least 1 day"), { statusCode: 400 });
  
  const plan = await Plan.findOneAndUpdate(
    { _id: req.params.id, gymId: req.gymId },
    { name, price, duration, features },
    { new: true, runValidators: true }
  );
  if (!plan) throw Object.assign(new Error("Plan not found"), { statusCode: 404 });
  sendResponse(res, { message: "Plan updated", data: plan });
});

const deletePlan = asyncHandler(async (req, res) => {
  // Check if any member is using this plan
  const memberCount = await Member.countDocuments({ currentPlan: req.params.id, gymId: req.gymId, status: "active" });
  if (memberCount > 0) {
    throw Object.assign(new Error("Cannot delete plan assigned to active members"), { statusCode: 400 });
  }
  const plan = await Plan.findOneAndDelete({ _id: req.params.id, gymId: req.gymId });
  if (!plan) throw Object.assign(new Error("Plan not found"), { statusCode: 404 });
  sendResponse(res, { message: "Plan deleted", data: {} });
});

module.exports = { createPlan, listPlans, updatePlan, deletePlan };
