const Booking = require("../models/booking.model");
const Member = require("../models/member.model");
const { ClassSlot } = require("../models/generic.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

const bookClassSlot = asyncHandler(async (req, res) => {
  const { classSlotId, memberId } = req.body;
  const slot = await ClassSlot.findById(classSlotId);
  if (!slot) throw Object.assign(new Error("Class slot not found"), { statusCode: 404 });
  const member = memberId ? await Member.findById(memberId) : await Member.findOne({ user: req.user._id });
  if (!member) throw Object.assign(new Error("Member not found"), { statusCode: 404 });
  const booking = await Booking.create({ classSlot: slot._id, member: member._id });
  sendResponse(res, { status: 201, message: "Class slot booked", data: booking });
});

const listBookings = asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPagination(req.query);
  const filter = req.user.role === "member" ? { member: (await Member.findOne({ user: req.user._id }))?._id } : {};
  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("classSlot member"),
    Booking.countDocuments(filter)
  ]);
  sendResponse(res, { message: "Bookings fetched", data: { items, total, page, limit } });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  booking.status = "cancelled";
  await booking.save();
  sendResponse(res, { message: "Booking cancelled", data: booking });
});

module.exports = { bookClassSlot, listBookings, cancelBooking };
