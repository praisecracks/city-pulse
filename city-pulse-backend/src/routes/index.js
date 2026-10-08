const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const pulseRoutes = require("./pulse.routes");
const uploadRoutes = require("./upload.routes");
const notificationRoutes = require("./notification.routes");
const waitlistRoutes = require("./waitlist.routes");
const contactRoutes = require("./contact.routes");
const analyticsRoutes = require("./analytics.routes");
const adminRoutes = require("./admin.routes");

router.use("/auth", authRoutes);
router.use("/pulses", pulseRoutes);
router.use("/uploads", uploadRoutes);
router.use("/notifications", notificationRoutes);
router.use("/waitlist", waitlistRoutes);
router.use("/contact", contactRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin-Pulse", adminRoutes);

module.exports = router;