const User = require("../models/user.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

const listTrainers = asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPagination(req.query);
  const query = { gymId: req.gymId, role: "trainer", ...(req.query.search ? { name: new RegExp(req.query.search, "i") } : {}) };
  const [items, total] = await Promise.all([
    User.find(query).select("-password -refreshTokens").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query)
  ]);
  sendResponse(res, { message: "Trainers fetched", data: { items, total, page, limit } });
});

const createTrainer = asyncHandler(async (req, res) => {
  const trainer = await User.create({ ...req.body, gymId: req.gymId, role: "trainer" });
  sendResponse(res, {
    status: 201,
    message: "Trainer created",
    data: { _id: trainer._id, name: trainer.name, email: trainer.email, phone: trainer.phone, role: trainer.role, specialty: trainer.specialty, status: trainer.status }
  });
});

const AuditLog = require("../models/audit.model");

const updateTrainer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, ...otherData } = req.body;
  
  const updatePayload = { ...otherData };
  if (status) {
    updatePayload.status = status;
    // If deactivating, clear all sessions
    if (status === 'inactive') {
      updatePayload.refreshTokens = [];
    }
  }

  const oldTrainer = await User.findOne({ _id: id, gymId: req.gymId, role: "trainer" });
  if (!oldTrainer) throw Object.assign(new Error("Trainer not found"), { statusCode: 404 });

  const trainer = await User.findOneAndUpdate(
    { _id: id, gymId: req.gymId, role: "trainer" },
    { $set: updatePayload },
    { new: true, runValidators: true }
  ).select("-password -refreshTokens");
  
  // Audit Logging for status change
  if (status && status !== oldTrainer.status) {
    await AuditLog.create({
      gymId: req.gymId,
      targetId: trainer._id,
      targetType: "Trainer",
      action: status === 'inactive' ? "DEACTIVATE_TRAINER" : "REACTIVATE_TRAINER",
      performedBy: req.user._id,
      oldValues: { status: oldTrainer.status },
      newValues: { status: trainer.status },
      reason: req.body.reason || "Administrative update"
    });
  }
  
  sendResponse(res, { message: "Trainer updated", data: trainer });
});

const deleteTrainer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trainer = await User.findOneAndDelete({ _id: id, gymId: req.gymId, role: "trainer" });
  if (!trainer) throw Object.assign(new Error("Trainer not found"), { statusCode: 404 });
  sendResponse(res, { message: "Trainer deleted" });
});

module.exports = { listTrainers, createTrainer, updateTrainer, deleteTrainer };
