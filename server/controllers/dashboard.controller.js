const Member = require("../models/member.model");
const Payment = require("../models/payment.model");
const User = require("../models/user.model");
const Attendance = require("../models/attendance.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { getCache, setCache } = require("../services/cache.service");

const getStats = asyncHandler(async (req, res) => {
  const cacheKey = `dashboard:stats:${req.gymId}`;
  const cached = await getCache(cacheKey);
  if (cached) return sendResponse(res, { message: "Dashboard stats fetched (cache)", data: cached });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [totalMembers, activePlans, revenueObj, activeTrainers, attendanceToday, revenueAnalytics, recentActivities] = await Promise.all([
    Member.countDocuments({ gymId: req.gymId }),
    Member.countDocuments({ gymId: req.gymId, isActivePlan: true }),
    Payment.aggregate([
      { $match: { gymId: req.gymId, status: "paid" } }, 
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    User.countDocuments({ gymId: req.gymId, role: "trainer" }),
    Attendance.countDocuments({ 
      gymId: req.gymId, 
      checkIn: { $gte: startOfDay, $lte: endOfDay } 
    }),
    // Revenue analytics for last 7 days
    Payment.aggregate([
      { 
        $match: { 
          gymId: req.gymId, 
          status: "paid", 
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    // Recent activities (mix of new members, payments, and attendance)
    Promise.all([
      Member.find({ gymId: req.gymId }).sort({ createdAt: -1 }).limit(2).populate("user", "name"),
      Payment.find({ gymId: req.gymId, status: "paid" }).sort({ createdAt: -1 }).limit(2).populate({ path: "member", populate: { path: "user", select: "name" } }),
      Attendance.find({ gymId: req.gymId }).sort({ checkIn: -1 }).limit(2).populate({ path: "member", populate: { path: "user", select: "name" } })
    ])
  ]);

  // Process activities into a uniform format
  const processedActivities = [
    ...recentActivities[0].map(m => ({ 
      text: `New member: ${m.user?.name || 'Unknown'}`, 
      time: m.createdAt, 
      color: "var(--clr-primary)" 
    })),
    ...recentActivities[1].map(p => ({ 
      text: `Payment of ₹${p.amount} from ${p.member?.user?.name || 'Unknown'}`, 
      time: p.createdAt, 
      color: "var(--clr-success)" 
    })),
    ...recentActivities[2].map(a => ({ 
      text: `${a.member?.user?.name || 'Unknown'} checked in`, 
      time: a.checkIn, 
      color: "var(--clr-secondary)" 
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  const data = { 
    totalMembers, 
    activePlans, 
    revenue: revenueObj[0]?.total || 0,
    activeTrainers,
    attendanceToday,
    revenueAnalytics,
    recentActivities: processedActivities
  };
  
  await setCache(cacheKey, data, 30);
  sendResponse(res, { message: "Dashboard stats fetched", data });
});

module.exports = { getStats };
