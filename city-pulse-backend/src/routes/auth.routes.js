const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { sendOtp, verifyOtp, getMe, deleteAccount, updateVisibility } = require("../controllers/auth.controller");
const { getFavorites, addFavorite, removeFavorite } = require("../controllers/favorites.controller");
const auth = require("../middlewares/auth");

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many OTP requests. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", otpLimiter, verifyOtp);

// Lets the app reconcile its cached roles with the server. Without this, a crash
// between publishing a listing and saving the new roles locally would leave the
// user looking like an unfinished applicant on next launch.
router.get("/me", auth, getMe);
router.delete("/delete-account", auth, deleteAccount);
router.patch("/me/visibility", auth, updateVisibility);

// Saved listings are account-scoped so they follow the person across devices.
// The static "/me/favorites" is declared before "/me/favorites/:pulseId" below
// so Express does not read "favorites" as a pulseId.
router.get("/me/favorites", auth, getFavorites);
router.post("/me/favorites", auth, addFavorite);
router.delete("/me/favorites/:pulseId", auth, removeFavorite);

module.exports = router;