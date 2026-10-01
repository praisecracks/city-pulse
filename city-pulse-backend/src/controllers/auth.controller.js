const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { sendOtpViaTermii } = require("../services/termii.service");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendOtp(req, res, next) {
  try {
    const { phone, name, email, intent } = req.body;

    if (!phone || !name || !email) {
      return res.status(400).json({ success: false, message: "Phone, name, and email are required" });
    }

    const normalizedPhone = phone.startsWith("0") ? phone : "0" + phone.replace(/^234/, "");

    const user = await User.findOne({ phone: normalizedPhone });

    if (user && user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      const lockUntil = user.otpExpires ? new Date(user.otpExpires).getTime() : 0;
      if (lockUntil > Date.now()) {
        return res.status(429).json({ success: false, message: "Too many attempts. Try again later." });
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const termiiResult = await sendOtpViaTermii(normalizedPhone, otp);

    if (!termiiResult.success) {
      return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
    }

    if (user) {
      user.otp = otp;
      user.otpExpires = expiresAt;
      user.otpAttempts += 1;
      await user.save();
    } else {
      await User.create({
        name,
        email,
        phone: normalizedPhone,
        otp,
        otpExpires: expiresAt,
        otpAttempts: 1,
      });
    }

    res.status(200).json({ success: true, message: "OTP sent" });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, message: "Phone and OTP code are required" });
    }

    const normalizedPhone = phone.startsWith("0") ? phone : "0" + phone.replace(/^234/, "");

    const user = await User.findOne({ phone: normalizedPhone });

    if (!user || !user.otp || !user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP expired or invalid" });
    }

    if (Date.now() > user.otpExpires.getTime()) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (user.otp !== code) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpVerified = true;

    // Record the applicant's intent only. The "agent" role is deliberately NOT
    // granted here: it is granted when they publish their first listing, so the
    // role always means "has a real listing" rather than "tapped a button".
    if (req.body.intent === "agent") {
      user.agentIntent = true;
    }

    await user.save();

    const token = jwt.sign(
      { userId: user._id, phone: user.phone, roles: user.roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    res.status(200).json({ success: true, data: { user, token } });
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
            businessProfileVisibility: user.businessProfileVisibility || 'public',
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
    
    if (!businessProfileVisibility || !['public', 'private'].includes(businessProfileVisibility)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid visibility value. Must be 'public' or 'private'" 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { businessProfileVisibility },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      data: { 
        user: {
          businessProfileVisibility: user.businessProfileVisibility,
        }
      } 
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtp, verifyOtp, getMe, deleteAccount, updateVisibility };