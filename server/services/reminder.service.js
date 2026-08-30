const Member = require("../models/member.model");
const Notification = require("../models/notification.model");
const whatsappService = require("./whatsapp.service");

/**
 * Number of calendar days (inclusive) of the renewal-reminder window:
 * TODAY, +1, +2, +3 -> members whose plan expires within 3 calendar days.
 */
const REMINDER_WINDOW_DAYS = 3;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Return the calendar-day boundary range [startOfToday, endOfToday+3].
 * Uses server-local time consistently with the rest of the application.
 */
const getReminderWindow = (now = new Date()) => {
  const today = startOfDay(now);
  return { start: today, end: endOfDay(addDays(today, REMINDER_WINDOW_DAYS)) };
};

/**
 * Find members whose CURRENT plan (membershipExpiryDate) expires within the
 * reminder window. Keeps the existing business behavior: only `status: "active"`
 * members qualify (so expired/cancelled/inactive/frozen are excluded, matching
 * the legacy cron). Missing/null expiry is naturally excluded by the date query.
 *
 * @param {object} opts
 * @param {string} opts.gymId      - Required tenant id.
 * @param {string} [opts.branchCode] - Branch to scope to; omit for all branches (superadmin ALL).
 * @param {Date}   [opts.now]      - Overridable reference time (testing / job).
 * @returns {Promise<Array>} Members with populated `user` and `currentPlan`.
 */
async function findExpiringMembers({ gymId, branchCode, now = new Date() }) {
  const { start, end } = getReminderWindow(now);
  const filter = {
    status: "active",
    currentPlan: { $ne: null },
    membershipExpiryDate: { $ne: null, $gte: start, $lte: end }
  };
  if (gymId) filter.gymId = gymId;
  if (branchCode) filter.branchCode = branchCode;

  return Member.find(filter)
    .populate("user", "name email phone")
    .populate("currentPlan", "name")
    .lean();
}

/**
 * Is there already an expiry reminder recorded for this member on the given
 * reminder calendar day? Identity: member + expiryDate + reminderDate + type.
 */
async function hasReminderBeenSent(member, reminderDate, expiryDate) {
  const dayStart = startOfDay(reminderDate);
  const dayEnd = endOfDay(reminderDate);
  return Notification.exists({
    member: member._id || member,
    type: "expiry",
    reminderDate: { $gte: dayStart, $lte: dayEnd },
    expiryDate: expiryDate
  });
}

/**
 * Create an in-app expiry reminder notification for a member.
 */
async function createInAppReminder(member, reminderDate) {
  const user = member.user;
  const memberName = (user && user.name) ? user.name : "there";
  const expiryLabel = member.membershipExpiryDate
    ? new Date(member.membershipExpiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const notification = await Notification.create({
    user: user && user._id ? user._id : member.user,
    member: member._id,
    plan: member.currentPlan && member.currentPlan._id ? member.currentPlan._id : (member.currentPlan || null),
    expiryDate: member.membershipExpiryDate,
    reminderDate: reminderDate,
    type: "expiry",
    channel: "inApp",
    title: "Membership Expiring Soon",
    message: `Hi ${memberName}, your membership expires on ${expiryLabel}. Please renew your membership to continue your fitness journey.`
  });
  return notification;
}

/**
 * Run the renewal-reminder pass and return a summary.
 *
 * Eligibility is calendar-day based (non-rolling window).
 * In-app notifications are always attempted. WhatsApp sends are delegated to
 * the provider abstraction which, until configured, reports `not_configured`
 * and skips without misclaiming delivery.
 *
 * @param {object} opts
 * @param {string} opts.gymId
 * @param {string} [opts.branchCode]
 * @param {Date}   [opts.now]
 * @returns {Promise<object>} Summary counts.
 */
async function sendRenewalReminders({ gymId, branchCode, now = new Date() }) {
  const reminderDate = startOfDay(now);
  const eligibleMembers = await findExpiringMembers({ gymId, branchCode, now });

  const summary = {
    eligible: eligibleMembers.length,
    inAppSent: 0,
    whatsappReady: 0,
    whatsappSkipped: 0,
    duplicatesSkipped: 0,
    whatsappStatus: "not_configured"
  };

  for (const member of eligibleMembers) {
    const alreadySent = await hasReminderBeenSent(member, reminderDate, member.membershipExpiryDate);
    if (alreadySent) {
      summary.duplicatesSkipped += 1;
      continue;
    }

    await createInAppReminder(member, reminderDate);
    summary.inAppSent += 1;

    // WhatsApp delivery through the service abstraction.
    const phone = member.user && member.user.phone ? member.user.phone.trim() : null;
    if (!phone) {
      summary.whatsappSkipped += 1;
      continue;
    }

    const result = await whatsappService.sendMessage({
      to: phone,
      template: "membership_expiry_reminder",
      variables: {
        name: (member.user && member.user.name) || "Member",
        expiryDate: member.membershipExpiryDate
      }
    });

    if (result.status === "not_configured") {
      // Provider absent: never claim delivery; count as skipped.
      summary.whatsappStatus = "not_configured";
      summary.whatsappSkipped += 1;
    } else if (result.sent) {
      summary.whatsappReady += 1;
    } else {
      summary.whatsappSkipped += 1;
    }
  }

  return summary;
}

module.exports = {
  REMINDER_WINDOW_DAYS,
  startOfDay,
  endOfDay,
  addDays,
  getReminderWindow,
  findExpiringMembers,
  hasReminderBeenSent,
  createInAppReminder,
  sendRenewalReminders
};
