const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { track } = require("../controllers/analytics.controller");

// Public tracking endpoint. The marketing site is the only caller, but it is
// still rate-limited so a bot cannot inflate the counts.
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: "Too many requests. Try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/track", trackLimiter, track);

module.exports = router;