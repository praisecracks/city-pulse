const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");
const {
  normalizeEmail,
  isValidEmail,
  normalizePhone,
  isStrongPassword,
} = require("../utils/auth-validation");
const emailService = require("../services/emailService");

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function signUp(req, res, next) {
  try {
    const { name, email, phone, password, intent } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 50 ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({ success: false, message: "Name, email, phone, and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: "Enter a valid Nigerian phone number" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character",
      });
    }

    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: "Phone number already registered" });
    }

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      otpVerified: false,
      isVerified: false,
      agentIntent: intent === "agent",
    });

    res.status(201).json({
      success: true,
      message: "Account created. Please sign in.",
      data: { userId: user._id },
    });
  } catch (err) {
    if (err?.code === 11000) {
      const duplicateField =
        Object.keys(err.keyPattern || {})[0] || Object.keys(err.keyValue || {})[0];
      const message =
        duplicateField === "phone"
          ? "Phone number already registered"
          : "Email already registered";
      return res.status(409).json({ success: false, message });
    }
    next(err);
  }
}

async function signIn(req, res, next) {
  try {
    const { identifier, password } = req.body;

    if (typeof identifier !== "string" || !identifier.trim() || typeof password !== "string" || !password) {
      return res.status(400).json({ success: false, message: "Phone/email and password are required" });
    }

    const trimmedIdentifier = identifier.trim();
    const isPhone = /^[+()\d\s-]+$/.test(trimmedIdentifier);
    let query;

    if (isPhone) {
      const normalizedPhone = normalizePhone(trimmedIdentifier);
      if (!normalizedPhone) {
        return res.status(400).json({ success: false, message: "Enter a valid Nigerian phone number" });
      }
      query = { phone: normalizedPhone };
    } else {
      const normalizedEmail = normalizeEmail(trimmedIdentifier);
      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ success: false, message: "Enter a valid email address" });
      }
      query = { email: normalizedEmail };
    }

    const user = await User.findOne(query).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone, roles: user.roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          otpVerified: user.otpVerified,
          isVerified: user.isVerified,
          roles: user.roles,
          agentIntent: user.agentIntent,
          trustScore: user.trustScore,
          badges: user.badges || [],
          createdAt: user.createdAt,
          businessProfileVisibility: user.businessProfileVisibility || "public",
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    try {
      emailService.validatePasswordResetEmailConfig();
    } catch (error) {
      console.error("[auth] Password reset email configuration error:", error.message);
      return res.status(503).json({
        success: false,
        message: "Password reset email is temporarily unavailable. Please try again later.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    }

    const resetToken = generateResetToken();
    user.resetPasswordToken = hashResetToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await user.save();

    try {
      await emailService.sendPasswordResetEmail(normalizedEmail, resetToken);
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      console.error("[auth] Password reset email delivery failed:", error.message);
      return res.status(503).json({
        success: false,
        message: "Password reset email is temporarily unavailable. Please try again later.",
      });
    }

    res.status(200).json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (typeof token !== "string" || !/^[a-f\d]{64}$/i.test(token) || !password) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: hashResetToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          otpVerified: user.otpVerified,
          isVerified: user.isVerified,
          roles: user.roles,
          agentIntent: user.agentIntent,
          trustScore: user.trustScore,
          badges: user.badges || [],
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          businessProfileVisibility: user.businessProfileVisibility || "public",
          favorites: (user.favorites || []).map(String),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function updateVisibility(req, res, next) {
  try {
    const { businessProfileVisibility } = req.body;

    if (!businessProfileVisibility || !["public", "private"].includes(businessProfileVisibility)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visibility value. Must be 'public' or 'private'",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { businessProfileVisibility },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          businessProfileVisibility: user.businessProfileVisibility,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { signUp, signIn, forgotPassword, resetPassword, getMe, deleteAccount, updateVisibility };