const cron = require("node-cron");
const Member = require("../models/member.model");
const Notification = require("../models/notification.model");

const startExpiryReminderJob = () => {
  // Run every hour to check for expirations
  cron.schedule("0 * * * *", async () => {
    const now = new Date();
    
    // 1. Mark expired memberships
    const expiredMembers = await Member.updateMany(
      {
        membershipExpiryDate: { $lt: now },
        status: "active"
      },
      {
        status: "expired",
        isActivePlan: false
      }
    );
    if (expiredMembers.modifiedCount > 0) {
      console.log(`Marked ${expiredMembers.modifiedCount} memberships as expired.`);
    }

    // 2. Send expiry reminders (at 9 AM daily)
    if (now.getHours() === 9) {
      const inThreeDays = new Date(now);
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      
      const expiring = await Member.find({
        membershipExpiryDate: { $gte: now, $lte: inThreeDays },
        status: "active"
      });
      
      if (expiring.length) {
        await Notification.insertMany(
          expiring.map((m) => ({
            user: m.user,
            title: "Membership expiring soon",
            message: "Your membership will expire within 3 days. Please renew soon.",
            type: "expiry"
          }))
        );
      }

      // 3. Send payment reminders for pending payments
      const pendingPaymentMembers = await Member.find({
        paymentStatus: "pending",
        status: { $in: ["active", "pending"] }
      });

      if (pendingPaymentMembers.length) {
        await Notification.insertMany(
          pendingPaymentMembers.map((m) => ({
            user: m.user,
            title: "Payment Pending",
            message: "You have a pending payment for your membership. Please pay to avoid access issues.",
            type: "payment"
          }))
        );
      }
    }
  });
};

module.exports = { startExpiryReminderJob };
