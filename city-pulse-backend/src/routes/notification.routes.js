const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} = require("../controllers/notification.controller");
const auth = require("../middlewares/auth");

// Every notification is account-scoped and private, so auth is required on all
// of them. A user must only ever read their own feed.
// Mounted at /api/v1/notifications by routes/index.js, so these paths are
// relative to that prefix. Repeating "/notifications" here would put the real
// endpoints at /api/v1/notifications/notifications and leave the client's
// requests 404ing.
router.get("/", auth, getNotifications);
router.get("/unread-count", auth, getUnreadCount);
router.patch("/:id/read", auth, markRead);
router.post("/read-all", auth, markAllRead);

module.exports = router;
