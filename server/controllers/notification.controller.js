const Notification = require("../models/notification.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

const listNotifications = asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPagination(req.query);
  const filter = req.user.role === "member" ? { user: req.user._id } : {};
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false })
  ]);
  sendResponse(res, { message: "Notifications fetched", data: { items, total, unread, page, limit } });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw Object.assign(new Error("Notification not found"), { statusCode: 404 });
  if (req.user.role === "member" && notification.user?.toString() !== req.user._id.toString()) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  notification.isRead = true;
  await notification.save();
  sendResponse(res, { message: "Notification marked as read", data: notification });
});

module.exports = { listNotifications, markAsRead };
