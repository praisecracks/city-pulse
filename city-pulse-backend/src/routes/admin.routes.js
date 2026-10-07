const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const adminAuth = require("../middlewares/adminAuth");
const { login } = require("../controllers/adminAuth.controller");
const {
  getSummary,
  getTimeline,
  getWaitlist,
  getContacts,
  getUsers,
} = require("../controllers/admin.controller");

// Login is the only public route on this router.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, login);

// Everything below requires an admin token.
router.get("/analytics/summary", adminAuth, getSummary);
router.get("/analytics/timeline", adminAuth, getTimeline);
router.get("/waitlist", adminAuth, getWaitlist);
router.get("/contacts", adminAuth, getContacts);
router.get("/users", adminAuth, getUsers);

module.exports = router;