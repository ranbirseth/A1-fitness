const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { sendRenewalReminders } = require("../services/reminder.service");
const whatsappService = require("../services/whatsapp.service");

// Mirrors payment.controller's branch resolution so superadmin may target a
// selected branch and admins are always locked to their own branch. Never
// trusts req.body.branchCode supplied by the client.
const resolveRequestedBranch = (req) =>
  req.user.role === "superadmin"
    ? (req.query.branchCode && req.query.branchCode !== "ALL" && req.query.branchCode !== "all"
        ? req.query.branchCode.trim().toUpperCase()
        : undefined)
    : (req.user.branchCode || "MAIN").trim().toUpperCase();

// POST /api/payments/reminders
// Sends renewal reminders to branch-scoped members whose CURRENT active plan
// expires within the 3-calendar-day window (today..+3).
const sendReminders = asyncHandler(async (req, res) => {
  const gymId = req.gymId;
  const branchCode = resolveRequestedBranch(req);

  const summary = await sendRenewalReminders({ gymId, branchCode, now: new Date() });

  const whatsappStatus = whatsappService.isConfigured() ? "configured" : "not_configured";

  sendResponse(res, {
    status: 200,
    message: summary.inAppSent > 0
      ? `${summary.inAppSent} renewal reminder(s) sent.`
      : "No new renewal reminders were needed.",
    data: { ...summary, whatsappStatus }
  });
});

module.exports = { sendReminders };
