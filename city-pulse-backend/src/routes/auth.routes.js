const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { signUp, signIn, forgotPassword, resetPassword, getMe, updateProfile, deleteAccount, updateVisibility } = require("../controllers/auth.controller");
const { getFavorites, addFavorite, removeFavorite } = require("../controllers/favorites.controller");
const auth = require("../middlewares/auth");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", authLimiter, signUp);
router.post("/signin", authLimiter, signIn);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

router.get("/me", auth, getMe);
router.patch("/me", auth, updateProfile);
router.delete("/delete-account", auth, deleteAccount);
router.patch("/me/visibility", auth, updateVisibility);

router.get("/me/favorites", auth, getFavorites);
router.post("/me/favorites", auth, addFavorite);
router.delete("/me/favorites/:pulseId", auth, removeFavorite);

module.exports = router;