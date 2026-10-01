const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const pulseRoutes = require("./pulse.routes");
const uploadRoutes = require("./upload.routes");
const notificationRoutes = require("./notification.routes");

router.use("/auth", authRoutes);
router.use("/pulses", pulseRoutes);
router.use("/uploads", uploadRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
