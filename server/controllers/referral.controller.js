const { Referral } = require("../models/generic.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

const applyReferral = asyncHandler(async (req, res) => {
  const { code, referredMemberId, benefit } = req.body;
  if (!code || !referredMemberId) {
    throw Object.assign(new Error("code and referredMemberId are required"), { statusCode: 400 });
  }
  const referral = await Referral.create({
    name: `Referral ${code}`,
    description: "Referral applied",
    metadata: { code, referredMemberId, benefit: benefit || "5% discount", appliedAt: new Date().toISOString() }
  });
  sendResponse(res, { status: 201, message: "Referral applied", data: referral });
});

const listReferrals = asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPagination(req.query);
  const [items, total] = await Promise.all([
    Referral.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Referral.countDocuments()
  ]);
  sendResponse(res, { message: "Referrals fetched", data: { items, total, page, limit } });
});

module.exports = { applyReferral, listReferrals };
