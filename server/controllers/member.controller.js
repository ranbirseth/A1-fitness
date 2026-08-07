const Member = require("../models/member.model");
const User = require("../models/user.model");
const Plan = require("../models/plan.model");
const Payment = require("../models/payment.model");
const Attendance = require("../models/attendance.model");
const Progress = require("../models/progress.model");
const Notification = require("../models/notification.model");
const WorkoutPlan = require("../models/workout.model");
const DietPlan = require("../models/diet.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

const calculateExpiry = (startDate, durationDays) => {
  const expiry = new Date(startDate);
  expiry.setDate(expiry.getDate() + parseInt(durationDays));
  return expiry;
};

const isPlanActive = (expiryDate, paymentStatus) => {
  return paymentStatus === "paid" && new Date() < new Date(expiryDate);
};

const generateUniqueSecretCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = Math.floor(100 + Math.random() * 900).toString();
    const existing = await Member.findOne({ secretCode: code });
    if (!existing) exists = false;
  }
  return code;
};

const createMember = asyncHandler(async (req, res) => {
  const { name, email, phone, password, trainerId, planId, membershipStartDate, branchCode = "MAIN" } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : undefined;
  const gymId = req.gymId;

  const user = await User.create({ gymId, name, email, phone, password, role: "member", photo });
  
  let membershipExpiryDate = null;
  if (planId) {
    const plan = await Plan.findOne({ _id: planId, gymId });
    const start = membershipStartDate ? new Date(membershipStartDate) : new Date();
    if (plan) {
      membershipExpiryDate = calculateExpiry(start, plan.duration);
    }
  }

  const secretCode = await generateUniqueSecretCode();

  const member = await Member.create({
    gymId,
    user: user._id,
    trainer: trainerId || null,
    currentPlan: planId || null,
    membershipStartDate: membershipStartDate || new Date(),
    membershipExpiryDate,
    isActivePlan: false,
    status: "pending",
    paymentStatus: "pending",
    secretCode,
    branchCode
  });
  sendResponse(res, { status: 201, message: "Member created", data: member });
});

const fetchMembers = async (query, gymId) => {
  const { skip, limit, page } = getPagination(query);
  const branchFilter = query.branchCode ? { branchCode: query.branchCode, gymId } : { gymId };
  
  // Status filter logic
  if (query.status && query.status !== "all") {
    branchFilter.status = query.status;
  }

  // Trainer filter logic
  if (query.trainerId) {
    branchFilter.trainer = new mongoose.Types.ObjectId(query.trainerId);
  }

  const q = query.search
    ? { 
        $or: [
          { "userDoc.name": new RegExp(query.search, "i") }, 
          { "userDoc.email": new RegExp(query.search, "i") },
          { "userDoc.phone": new RegExp(query.search, "i") }
        ] 
      }
    : {};
  const baseLookup = [
    { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "userDoc" } },
    { $unwind: "$userDoc" },
    { $lookup: { from: "users", localField: "trainer", foreignField: "_id", as: "trainerDoc" } },
    { $lookup: { from: "plans", localField: "currentPlan", foreignField: "_id", as: "planDoc" } }
  ];
  const filterStages = [{ $match: branchFilter }, ...(Object.keys(q).length ? [{ $match: q }] : [])];
  const pipeline = [
    ...baseLookup, 
    ...filterStages, 
    { $sort: { createdAt: -1 } }, 
    { $skip: skip }, 
    { $limit: limit },
    {
      $project: {
        _id: 1,
        gymId: 1,
        isActivePlan: 1,
        membershipExpiryDate: 1,
        status: 1,
        paymentStatus: 1,
        secretCode: 1,
        createdAt: 1,
        user: "$userDoc",
        trainer: { $arrayElemAt: ["$trainerDoc", 0] },
        currentPlan: { $arrayElemAt: ["$planDoc", 0] }
      }
    }
  ];
  const [items, totalObj] = await Promise.all([
    Member.aggregate(pipeline),
    Member.aggregate([...baseLookup, ...filterStages, { $count: "count" }])
  ]);
  return { items, page, limit, total: totalObj[0]?.count || 0 };
};

const listMembers = asyncHandler(async (req, res) => {
  const data = await fetchMembers(req.query, req.gymId);
  sendResponse(res, { message: "Members fetched", data });
});

const searchMembers = asyncHandler(async (req, res) => {
  const data = await fetchMembers({ ...req.query, search: req.query.q || "" }, req.gymId);
  sendResponse(res, { message: "Members search fetched", data });
});

const getMember = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId }).populate("user trainer currentPlan");
  if (!member) throw Object.assign(new Error("Member not found in your gym"), { statusCode: 404 });
  sendResponse(res, { message: "Member fetched", data: member });
});

const AuditLog = require("../models/audit.model");
const mongoose = require("mongoose");

const updateMember = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId }).session(session);
    if (!member) throw Object.assign(new Error("Member not found in your gym"), { statusCode: 404 });

    const { name, phone, email, password, reason, trainerId, ...memberPayload } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

    const oldMemberValues = member.toObject();
    let oldUserValues = null;

    if (name || phone || email || photo || password || memberPayload.status) {
      const user = await User.findById(member.user).session(session);
      if (user) {
        oldUserValues = user.toObject();
        const userUpdate = {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(email && { email }),
          ...(photo && { photo }),
          ...(password && { password }),
        };

        if (memberPayload.status === 'inactive') {
          user.status = 'inactive';
          user.refreshTokens = []; // Immediate session termination
        } else if (memberPayload.status === 'active') {
          user.status = 'active';
        }

        Object.assign(user, userUpdate);
        await user.save({ session });
      }
    }

    if (trainerId !== undefined) {
      member.trainer = trainerId || null;
    }

    Object.assign(member, memberPayload);
    await member.save({ session });

    // Audit Logging
    await AuditLog.create([{
      gymId: req.gymId,
      targetId: member._id,
      targetType: "Member",
      action: memberPayload.status === 'inactive' ? "DEACTIVATE_MEMBER" : "UPDATE_MEMBER",
      performedBy: req.user._id,
      oldValues: { member: oldMemberValues, user: oldUserValues },
      newValues: { member: member.toObject(), status: memberPayload.status },
      reason: reason || (memberPayload.status === 'inactive' ? "Administrative deactivation" : "Profile update")
    }], { session });

    await session.commitTransaction();
    session.endSession();

    if (req.app.locals.io) {
      req.app.locals.io.to(req.gymId).emit("member:updated", {
        memberId: member._id,
        status: member.status,
        action: memberPayload.status === 'inactive' ? "deactivated" : "updated"
      });
    }

    sendResponse(res, { 
      message: memberPayload.status === 'inactive' ? "Member deactivated successfully" : "Member updated", 
      data: await member.populate("user trainer currentPlan") 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const deleteMember = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId });
  if (!member) throw Object.assign(new Error("Member not found in your gym"), { statusCode: 404 });
  
  const userId = member.user;
  const memberId = member._id;

  // Perform cascade deletion of all related data
  await Promise.all([
    Member.findByIdAndDelete(memberId),
    User.findByIdAndDelete(userId),
    Payment.deleteMany({ member: memberId }),
    Attendance.deleteMany({ member: memberId }),
    Progress.deleteMany({ member: memberId }),
    Notification.deleteMany({ user: userId }),
    WorkoutPlan.deleteMany({ assignedTo: memberId, isTemplate: false }),
    DietPlan.deleteMany({ assignedTo: memberId, isTemplate: false })
  ]);

  sendResponse(res, { message: "Member and all associated data deleted permanently", data: {} });
});

const assignPlan = asyncHandler(async (req, res) => {
  const { planId, membershipStartDate } = req.body;
  const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId });
  if (!member) throw Object.assign(new Error("Member not found in your gym"), { statusCode: 404 });
  const plan = await Plan.findOne({ _id: planId, gymId: req.gymId });
  if (!plan) throw Object.assign(new Error("Plan not found in your gym"), { statusCode: 404 });
  const startDate = membershipStartDate ? new Date(membershipStartDate) : new Date();
  member.currentPlan = plan._id;
  member.membershipStartDate = startDate;
  member.membershipExpiryDate = calculateExpiry(startDate, plan.duration);
  member.isActivePlan = false; // Requires payment to become active
  member.paymentStatus = "pending";
  // Only set to pending if they are already pending or inactive (new signup/discarded)
  if (member.status === "pending" || member.status === "inactive") {
    member.status = "pending";
  } else {
    // If they were active/expired/cancelled, stay active (access will be blocked by paymentStatus)
    member.status = "active";
  }
  await member.save();

  if (req.app.locals.io) {
    req.app.locals.io.to(req.gymId).emit("member:updated", {
      memberId: member._id,
      userId: member.user,
      action: "plan_assigned"
    });
  }

  sendResponse(res, { message: "Plan assigned to member. Awaiting payment.", data: member });
});

const renewPlan = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId });
  if (!member) throw Object.assign(new Error("Member not found in your gym"), { statusCode: 404 });
  
  const plan = await Plan.findOne({ _id: planId || member.currentPlan, gymId: req.gymId });
  if (!plan) throw Object.assign(new Error("Plan not found"), { statusCode: 404 });

  // If active, extend from current expiry. If expired, start from today.
  const isCurrentlyActive = member.status === "active" && member.membershipExpiryDate && new Date() < new Date(member.membershipExpiryDate);
  const startDate = isCurrentlyActive ? new Date(member.membershipExpiryDate) : new Date();
  
  member.membershipStartDate = startDate;
  member.membershipExpiryDate = calculateExpiry(startDate, plan.duration);
  member.currentPlan = plan._id;
  member.paymentStatus = "pending";
  member.isActivePlan = false;
  
  if (member.status === "pending" || member.status === "inactive") {
    member.status = "pending";
  } else {
    member.status = "active";
  }
  
  await member.save();
  sendResponse(res, { message: "Plan renewed. Awaiting payment.", data: member });
});

const upgradePlan = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId });
  if (!member) throw Object.assign(new Error("Member not found"), { statusCode: 404 });
  
  const plan = await Plan.findOne({ _id: planId, gymId: req.gymId });
  if (!plan) throw Object.assign(new Error("Plan not found"), { statusCode: 404 });

  // Upgrading usually starts from today
  const startDate = new Date();
  member.membershipStartDate = startDate;
  member.membershipExpiryDate = calculateExpiry(startDate, plan.duration);
  member.currentPlan = plan._id;
  member.paymentStatus = "pending";
  member.isActivePlan = false;
  
  if (member.status === "pending" || member.status === "inactive") {
    member.status = "pending";
  } else {
    member.status = "active";
  }

  await member.save();
  sendResponse(res, { message: "Plan upgraded. Awaiting payment.", data: member });
});

const cancelPlan = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId });
  if (!member) throw Object.assign(new Error("Member not found"), { statusCode: 404 });
  
  member.status = "cancelled";
  member.isActivePlan = false;
  await member.save();
  sendResponse(res, { message: "Subscription cancelled", data: member });
});

const freezePlan = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId });
  if (!member || member.status !== "active") throw Object.assign(new Error("Only active members can freeze plans"), { statusCode: 400 });
  
  const now = new Date();
  const expiry = new Date(member.membershipExpiryDate);
  const diffTime = expiry - now;
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (remainingDays <= 0) throw Object.assign(new Error("Cannot freeze an expired plan"), { statusCode: 400 });
  
  member.status = "frozen";
  member.isActivePlan = false;
  member.frozenAt = now;
  member.remainingDays = remainingDays;
  await member.save();
  
  sendResponse(res, { message: "Plan frozen successfully", data: member });
});

const resumePlan = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId });
  if (!member || member.status !== "frozen") throw Object.assign(new Error("Only frozen plans can be resumed"), { statusCode: 400 });
  
  const now = new Date();
  member.status = "active";
  member.isActivePlan = true;
  member.membershipExpiryDate = calculateExpiry(now, member.remainingDays);
  member.frozenAt = null;
  member.remainingDays = null;
  await member.save();
  
  sendResponse(res, { message: "Plan resumed successfully", data: member });
});

const getMyProfile = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ user: req.user._id, gymId: req.gymId }).populate("user trainer currentPlan");
  if (!member) throw Object.assign(new Error("Member profile not found"), { statusCode: 404 });
  sendResponse(res, { message: "Profile fetched", data: member });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const payload = {};
  ["name", "phone", "email"].forEach((k) => {
    if (req.body[k] !== undefined) payload[k] = req.body[k];
  });
  if (req.file) payload.photo = `/uploads/${req.file.filename}`;
  await User.findByIdAndUpdate(req.user._id, payload);
  const member = await Member.findOne({ user: req.user._id, gymId: req.gymId }).populate("user trainer currentPlan");
  sendResponse(res, { message: "Profile updated", data: member });
});

const approveMember = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, gymId: req.gymId });
  if (!member) throw Object.assign(new Error("Member not found"), { statusCode: 404 });
  
  member.status = "active";
  await member.save();

  // Also ensure User document is active (though it defaults to active)
  await User.findByIdAndUpdate(member.user, { status: "active" });
  
  sendResponse(res, { message: "Member approved successfully", data: member });
});

module.exports = { 
  createMember, 
  listMembers, 
  searchMembers, 
  getMember, 
  updateMember, 
  deleteMember, 
  assignPlan, 
  renewPlan,
  upgradePlan,
  cancelPlan,
  freezePlan,
  resumePlan,
  approveMember,
  getMyProfile, 
  updateMyProfile 
};
