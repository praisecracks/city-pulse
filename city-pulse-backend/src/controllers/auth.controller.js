const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function signUp(req, res, next) {
  try {
    const { name, email, phone, password, intent } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "Name, email, phone, and password are required" });
    }

    const normalizedPhone = phone.startsWith("0") ? phone : "0" + phone.replace(/^234/, "");
    const normalizedEmail = String(email).toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
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
      otpVerified: true,
      agentIntent: intent === "agent",
    });

    res.status(201).json({
      success: true,
      message: "Account created. Please sign in.",
      data: { userId: user._id },
    });
  } catch (err) {
    next(err);
  }
}

async function signIn(req, res, next) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Phone/email and password are required" });
    }

    const normalizedIdentifier = identifier.toLowerCase().trim();
    const isPhone = /^[\d\s\+\-]+$/.test(normalizedIdentifier);

    const query = isPhone
      ? { phone: normalizedIdentifier.startsWith("0") ? normalizedIdentifier : "0" + normalizedIdentifier.replace(/^234/, "") }
      : { email: normalizedIdentifier };

    const user = await User.findOne(query).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.otpVerified) {
      return res.status(401).json({ success: false, message: "Account not verified" });
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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({ success: true, message: "If the email exists, a reset link has been sent" });
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    console.log(`[DEV] Password reset link for ${normalizedEmail}: ${resetUrl}`);

    res.status(200).json({ success: true, message: "If the email exists, a reset link has been sent" });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password");

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