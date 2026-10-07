const Analytics = require("../models/analytics.model");
const UserWaitlist = require("../models/userWaitlist.model");
const AgentWaitlist = require("../models/agentWaitlist.model");
const Contact = require("../models/contact.model");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/v1/admin/analytics/summary
 * Returns high-level counts for the dashboard.
 */
exports.getSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = new Date(now.getTime() - 7 * MS_PER_DAY);
  const monthStart = new Date(now.getTime() - 30 * MS_PER_DAY);

  const [totalViews, todayViews, weekViews, monthViews] = await Promise.all([
    Analytics.countDocuments({ kind: "pageview" }),
    Analytics.countDocuments({ kind: "pageview", createdAt: { $gte: todayStart } }),
    Analytics.countDocuments({ kind: "pageview", createdAt: { $gte: weekStart } }),
    Analytics.countDocuments({ kind: "pageview", createdAt: { $gte: monthStart } }),
  ]);

  const [formStarts, formSubmits, userWaitlistCount, agentWaitlistCount, contactCount, userCount] =
    await Promise.all([
      Analytics.countDocuments({ kind: "event", event: "form_start" }),
      Analytics.countDocuments({ kind: "event", event: "form_submit" }),
      UserWaitlist.countDocuments({}),
      AgentWaitlist.countDocuments({}),
      Contact.countDocuments({}),
      User.countDocuments({}),
    ]);

  res.status(200).json({
    success: true,
    data: {
      views: { total: totalViews, today: todayViews, week: weekViews, month: monthViews },
      events: { formStarts, formSubmits },
      waitlist: { users: userWaitlistCount, agents: agentWaitlistCount },
      contacts: contactCount,
      users: userCount,
    },
  });
});

/**
 * GET /api/v1/admin/analytics/timeline
 * Returns daily counts for the last N days.
 * Query: ?days=30
 */
exports.getTimeline = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 90);
  const start = startOfDay(new Date(Date.now() - (days - 1) * MS_PER_DAY));

  const pipeline = [
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          kind: "$kind",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ];

  const rows = await Analytics.aggregate(pipeline);

  // Build a flat array: [{ date, pageviews, events }]
  const byDate = {};
  for (const row of rows) {
    if (!byDate[row._id.date]) {
      byDate[row._id.date] = { date: row._id.date, pageviews: 0, events: 0 };
    }
    if (row._id.kind === "pageview") byDate[row._id.date].pageviews += row.count;
    else byDate[row._id.date].events += row.count;
  }

  const data = Object.values(byDate);
  res.status(200).json({ success: true, data });
});

/**
 * GET /api/v1/admin/waitlist
 * Returns user + agent waitlist entries (paginated).
 */
exports.getWaitlist = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const skip = (page - 1) * limit;

  const [users, agents, userTotal, agentTotal] = await Promise.all([
    UserWaitlist.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    AgentWaitlist.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    UserWaitlist.countDocuments({}),
    AgentWaitlist.countDocuments({}),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: { data: users, total: userTotal, page, limit },
      agents: { data: agents, total: agentTotal, page, limit },
    },
  });
});

/**
 * GET /api/v1/admin/contacts
 * Returns contact messages with status.
 */
exports.getContacts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Contact.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Contact.countDocuments({}),
  ]);

  res.status(200).json({ success: true, data: { data, total, page, limit } });
});

/**
 * GET /api/v1/admin/users
 * Returns registered users.
 */
exports.getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments({}),
  ]);

  res.status(200).json({ success: true, data: { data, total, page, limit } });
});