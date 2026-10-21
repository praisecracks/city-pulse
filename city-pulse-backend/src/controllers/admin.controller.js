const Analytics = require("../models/analytics.model");
const UserWaitlist = require("../models/userWaitlist.model");
const AgentWaitlist = require("../models/agentWaitlist.model");
const Contact = require("../models/contact.model");
const User = require("../models/user.model");
const Pulse = require("../models/pulse.model");
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

/**
 * GET /api/v1/admin-pulse/listings
 * Returns provider listings filtered by moderation state, including owner and
 * photo details. Missing reviewStatus is a legacy, publicly visible listing.
 */
exports.getPendingListings = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const reviewStatus = req.query.reviewStatus || "pending_review";
  const filters = {
    pending_review: { reviewStatus: "pending_review" },
    approved: {
      $or: [
        { reviewStatus: "approved" },
        { reviewStatus: { $exists: false } },
      ],
    },
    rejected: { reviewStatus: "rejected" },
    all: {},
  };

  if (!Object.prototype.hasOwnProperty.call(filters, reviewStatus)) {
    return res.status(400).json({
      success: false,
      message: "Listing filter must be pending_review, approved, rejected, or all.",
    });
  }
  const query = filters[reviewStatus];

  const [data, total] = await Promise.all([
    Pulse.find(query)
      .populate("agent", "name email phone isVerified")
      .sort({ createdAt: reviewStatus === "pending_review" ? 1 : -1 })
      .skip(skip)
      .limit(limit),
    Pulse.countDocuments(query),
  ]);

  res.status(200).json({ success: true, data: { data, total, page, limit } });
});

/**
 * GET /api/v1/admin/users/:id
 * Returns a single user with their listings (onboarding data) for verification.
 */
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -resetPasswordToken -resetPasswordExpires");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  const listings = await Pulse.find({ agent: user._id })
    .sort({ createdAt: -1 })
    .select("title category status reviewStatus reviewNote reviewedAt images contactPhone email whatsapp address coordinates details createdAt");
  res.status(200).json({ success: true, data: { user, listings } });
});

/**
 * PATCH /api/v1/admin/users/:id/verify
 * Verifies or unverifies a user (platform/admin review).
 */
exports.verifyUser = asyncHandler(async (req, res) => {
  const { isVerified, note } = req.body || {};
  if (typeof isVerified !== "boolean") {
    return res.status(400).json({ success: false, message: "isVerified must be a boolean." });
  }
  if (note !== undefined && (typeof note !== "string" || note.trim().length > 500)) {
    return res.status(400).json({ success: false, message: "Verification note must be text no longer than 500 characters." });
  }
  const update = {
    isVerified,
    verifiedAt: new Date(),
    verifiedBy: req.admin?.sub || "admin",
    verificationNote: typeof note === "string" ? note.trim() : "",
  };
  const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true })
    .select("_id name email phone isVerified verifiedAt verifiedBy verificationNote");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.status(200).json({ success: true, data: user });
});

/**
 * PATCH /api/v1/admin/users/:id/block
 */
exports.blockUser = asyncHandler(async (req, res) => {
  const { isBlocked, note } = req.body || {};
  if (typeof isBlocked !== "boolean") {
    return res.status(400).json({ success: false, message: "isBlocked must be a boolean." });
  }
  if (note !== undefined && (typeof note !== "string" || note.trim().length > 500)) {
    return res.status(400).json({ success: false, message: "Block note must be text no longer than 500 characters." });
  }
  const update = {
    isBlocked,
    blockedAt: isBlocked ? new Date() : null,
    blockedBy: isBlocked ? (req.admin?.sub || "admin") : "",
    blockNote: isBlocked && typeof note === "string" ? note.trim() : "",
  };
  const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true })
    .select("_id name email phone isVerified isBlocked blockedAt blockedBy blockNote");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.status(200).json({ success: true, data: user });
});

/**
 * DELETE /api/v1/admin/users/:id
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  await Pulse.deleteMany({ agent: user._id });
  res.status(200).json({ success: true, message: "User deleted." });
});

/**
 * PATCH /api/v1/admin-pulse/listings/:id/review
 * Approves or rejects a pending provider listing.
 */
exports.reviewListing = asyncHandler(async (req, res) => {
  const { reviewStatus, note } = req.body || {};

  if (!["approved", "rejected"].includes(reviewStatus)) {
    return res.status(400).json({
      success: false,
      message: "Review status must be approved or rejected.",
    });
  }
  if (note !== undefined && (typeof note !== "string" || note.trim().length > 500)) {
    return res.status(400).json({
      success: false,
      message: "Review notes must be text no longer than 500 characters.",
    });
  }
  if (reviewStatus === "rejected" && (typeof note !== "string" || !note.trim())) {
    return res.status(400).json({
      success: false,
      message: "Add a reason so the provider knows what to correct before resubmitting.",
    });
  }

  const pulse = await Pulse.findOneAndUpdate(
    { _id: req.params.id, reviewStatus: "pending_review" },
    {
      $set: {
        reviewStatus,
        reviewNote: typeof note === "string" ? note.trim() : "",
        reviewedAt: new Date(),
        reviewedBy: req.admin.sub,
      },
    },
    { new: true, runValidators: true },
  ).populate("agent", "name email phone isVerified");

  if (!pulse) {
    return res.status(404).json({
      success: false,
      message: "Pending listing not found. It may have already been reviewed.",
    });
  }

  const agentId = pulse.agent?._id || pulse.agent;
  const agent = await User.findByIdAndUpdate(
    agentId,
    { $set: { isVerified: reviewStatus === "approved" } },
    { new: true, runValidators: true },
  ).select("_id name email phone isVerified");

  if (!agent) {
    throw new Error("Listing owner could not be found while updating verification.");
  }

  pulse.agent = agent;
  res.status(200).json({ success: true, data: pulse });
});