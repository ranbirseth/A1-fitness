const Payment = require("../models/payment.model");
const Notification = require("../models/notification.model");
const Member = require("../models/member.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

const createPayment = asyncHandler(async (req, res) => {
  const { member: memberId, plan: planId, amount, method = "cash", status = "paid", note, date } = req.body;
  if (!memberId || !planId || !amount) {
    throw Object.assign(new Error("Member, Plan and Amount are required"), { statusCode: 400 });
  }

  const gymId = req.gymId;
  const invoiceNumber = `INV-${Date.now()}`;
  
  const payment = await Payment.create({
    gymId,
    member: memberId,
    plan: planId,
    amount,
    method,
    status,
    note,
    date: date || new Date(),
    invoiceNumber,
    invoice: {
      invoiceNumber,
      amount,
      member: memberId,
      plan: planId,
      createdAt: new Date().toISOString()
    }
  });

  const member = await Member.findOne({ _id: memberId, gymId });
  if (member) {
    // If payment is successful, update member status and payment status
    if (status === "paid") {
      member.paymentStatus = "paid";
      // If plan is still within expiry, set to active
      if (member.membershipExpiryDate && new Date() < new Date(member.membershipExpiryDate)) {
        member.status = "active";
        member.isActivePlan = true;
      }
      await member.save();
    }

    await Notification.create({
      user: member.user,
      title: status === "pending" ? "Payment pending" : "Payment received",
      message: `Invoice ${invoiceNumber} for amount ${amount} (${status})`,
      type: "payment"
    });
  }

  sendResponse(res, { status: 201, message: "Payment recorded", data: payment });
});

const listPayments = asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPagination(req.query);
  const filter = {
    gymId: req.gymId,
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(req.query.method ? { method: req.query.method } : {})
  };
  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "member", populate: { path: "user", select: "name" } })
      .populate("plan", "name"),
    Payment.countDocuments(filter)
  ]);
  sendResponse(res, { message: "Payments fetched", data: { items, page, limit, total } });
});

const getMyPayments = asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPagination(req.query);
  
  // Get the member profile for the current user
  const member = await Member.findOne({ user: req.user._id, gymId: req.gymId });
  if (!member) throw Object.assign(new Error("Member profile not found"), { statusCode: 404 });
  
  const filter = { gymId: req.gymId, member: member._id };
  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "member", populate: { path: "user", select: "name" } })
      .populate("plan", "name"),
    Payment.countDocuments(filter)
  ]);
  sendResponse(res, { message: "Payments fetched", data: { items, page, limit, total } });
});

const pendingDues = asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPagination(req.query);
  const filter = { gymId: req.gymId, status: "pending" };
  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "member", populate: { path: "user", select: "name" } })
      .populate("plan", "name"),
    Payment.countDocuments(filter)
  ]);
  sendResponse(res, { message: "Pending dues fetched", data: { items, page, limit, total } });
});

const getInvoice = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, gymId: req.gymId })
    .populate({ path: "member", populate: { path: "user", select: "name email phone" } })
    .populate("plan", "name description duration");
  if (!payment) throw Object.assign(new Error("Payment not found in your gym"), { statusCode: 404 });
  
  // Create a detailed invoice object for the frontend
  const invoiceData = {
    ...payment.invoice,
    invoiceNumber: payment.invoiceNumber,
    date: payment.date,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    member: payment.member,
    plan: payment.plan
  };
  
  sendResponse(res, { message: "Invoice fetched", data: invoiceData });
});

const createOnlinePaymentIntent = asyncHandler(async (req, res) => {
  const mockIntentId = `MOCK_INTENT_${Date.now()}`;
  sendResponse(res, {
    status: 201,
    message: "Mock online payment intent created",
    data: { intentId: mockIntentId, status: "created", gateway: "mock" }
  });
});

const confirmOnlinePayment = asyncHandler(async (req, res) => {
  const { intentId, member, amount } = req.body;
  if (!intentId || !member || !amount) throw Object.assign(new Error("intentId, member and amount are required"), { statusCode: 400 });
  req.body.method = "online";
  req.body.status = "paid";
  const invoiceNumber = `INV-${Date.now()}`;
  const payment = await Payment.create({
    gymId: req.gymId,
    member,
    amount,
    method: "online",
    status: "paid",
    invoiceNumber,
    invoice: { invoiceNumber, intentId, amount, member, createdAt: new Date().toISOString(), gateway: "mock" }
  });
  sendResponse(res, { message: "Mock online payment confirmed", data: payment });
});

const markAsPaid = asyncHandler(async (req, res) => {
  const payment = await Payment.findOneAndUpdate(
    { _id: req.params.id, gymId: req.gymId },
    { status: "paid" },
    { new: true }
  );
  if (!payment) throw Object.assign(new Error("Payment not found"), { statusCode: 404 });
  
  const member = await Member.findOne({ _id: payment.member, gymId: req.gymId });
  if (member) {
    member.paymentStatus = "paid";
    if (member.membershipExpiryDate && new Date() < new Date(member.membershipExpiryDate)) {
      member.status = "active";
      member.isActivePlan = true;
    }
    await member.save();
  }
  
  sendResponse(res, { message: "Payment marked as paid", data: payment });
});

const markAsUnpaid = asyncHandler(async (req, res) => {
  const payment = await Payment.findOneAndUpdate(
    { _id: req.params.id, gymId: req.gymId },
    { status: "pending" },
    { new: true }
  );
  if (!payment) throw Object.assign(new Error("Payment not found"), { statusCode: 404 });
  
  const member = await Member.findOne({ _id: payment.member, gymId: req.gymId });
  if (member) {
    member.paymentStatus = "pending";
    member.status = "pending";
    member.isActivePlan = false;
    await member.save();
  }
  
  sendResponse(res, { message: "Payment marked as unpaid", data: payment });
});

module.exports = { 
  createPayment, 
  listPayments,
  getMyPayments,
  pendingDues, 
  getInvoice, 
  createOnlinePaymentIntent, 
  confirmOnlinePayment,
  markAsPaid,
  markAsUnpaid
};
