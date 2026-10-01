const Notification = require("../models/notification.model");
const asyncHandler = require("../utils/asyncHandler");

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * @desc    List the signed-in account's notifications, newest first
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(String(req.query.limit || DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      // readAt is the only field the client needs to render unread state; the
      // rest of the document is small and this keeps the count query cheap.
      .select("type title body action data readAt createdAt"),
    Notification.countDocuments({ user: req.user._id, readAt: null }),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    data: notifications,
  });
});

/**
 * @desc    Unread notification count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 *
 * Separate from the list because the tab badge is polled far more often than
 * the feed itself, and does not need the documents.
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ user: req.user._id, readAt: null });
  res.status(200).json({ success: true, unreadCount });
});

/**
 * @desc    Mark one notification read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 *
 * Scoped to the caller's own notifications, so an id belonging to someone else
 * is a 404 rather than a silent success.
 */
exports.markRead = asyncHandler(async (req, res) => {
  // Scoped to the caller's own notifications, so an id belonging to someone else
  // is a 404 rather than a silent success.
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  res.status(200).json({ success: true, data: { id: notification._id, readAt: notification.readAt } });
});

/**
 * @desc    Mark every notification read
 * @route   POST /api/v1/notifications/read-all
 * @access  Private
 */
exports.markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, readAt: null },
    { $set: { readAt: new Date() } }
  );

  res.status(200).json({ success: true, updated: result.modifiedCount || 0 });
});
