const Progress = require("../models/progress.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");

const createProgress = asyncHandler(async (req, res) => {
  const bmi = req.body.weightKg / ((req.body.heightCm / 100) ** 2);
  const progress = await Progress.create({ ...req.body, bmi: Number(bmi.toFixed(2)) });
  sendResponse(res, { status: 201, message: "Progress logged", data: progress });
});

const listProgress = asyncHandler(async (req, res) =>
  sendResponse(res, { message: "Progress fetched", data: await Progress.find({ member: req.params.memberId }).sort({ createdAt: -1 }) })
);

module.exports = { createProgress, listProgress };
