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

/**
 * True when OTPs are logged instead of texted, which is the only situation where
 * the code can safely be returned in the response. Kept next to the generator so
 * the two can never disagree about when that is.
 */
function isDevOtpEchoEnabled() {
  return process.env.NODE_ENV === "development" && process.env.TERMII_DEV_MODE === "true";
}

/**
 * A unique address for an account that has not supplied a real one yet.
 *
 * Signing in with a phone alone means the client sends the same placeholder for
 * everyone, and the unique index on `email` would then reject the second person
 * to sign up — a 500 that looks like the signup is broken. Namespacing the
 * placeholder by phone keeps the record traceable and the write legal; a later
 * sign-up with a real address replaces it.
 */
function placeholderEmail(email, phone) {
  const [local, domain] = String(email).toLowerCase().split("@");
  const safeLocal = local.replace(/[^a-z0-9]/g, "");
  const safeDomain = domain.replace(/[^a-z0-9.]/g, "");
  return `${safeLocal || "user"}.${phone}@${safeDomain || "citypulse.local"}`;
}

async function sendOtp(req, res, next) {
  try {
    const { phone, name, email, intent } = req.body;

    if (!phone || !name || !email) {
      return res.status(400).json({ success: false, message: "Phone, name, and email are required" });
    }

    const normalizedPhone = phone.startsWith("0") ? phone : "0" + phone.replace(/^234/, "");
    const normalizedEmail = String(email).toLowerCase();

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
      // The address is parked, never applied. sendOtp has not proven that the
      // caller controls this phone — it only proved they know the number — so
      // writing `email` here let anyone who knew someone's number permanently
      // re-point that account's address, and freed the old one to be claimed.
      // verifyOtp promotes it once the code has been proven.
      //
      // `email` itself is only overwritten when it is still a generated
      // stand-in, which is the one case where adopting a new address is correct:
      // the account was created by the phone-only sign-in screen, which sends
      // the same placeholder for everyone.
      if (user.emailIsPlaceholder) {
        const emailOwner = await User.findOne({ email: normalizedEmail });
        if (!emailOwner || String(emailOwner._id) === String(user._id)) {
          user.pendingEmail = normalizedEmail;
        }
      }
      user.otp = otp;
      user.otpExpires = expiresAt;
      user.otpAttempts += 1;
      await user.save();
    } else {
      const emailOwner = await User.findOne({ email: normalizedEmail });
      const usePlaceholder = Boolean(emailOwner);
      await User.create({
        name,
        email: usePlaceholder ? placeholderEmail(normalizedEmail, normalizedPhone) : normalizedEmail,
        emailIsPlaceholder: usePlaceholder,
        phone: normalizedPhone,
        otp,
        otpExpires: expiresAt,
        otpAttempts: 1,
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent",
      // Dev only: the code is logged rather than texted, so it is handed back to
      // the client too. Without this the app would have to invent its own code,
      // which is never the one the server will accept on verify.
      ...(isDevOtpEchoEnabled() ? { devOtp: otp } : {}),
    });
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

    // Whether the email was actually swapped, so the save can be undone if the
    // unique index rejects it.
    let promotedEmail = null;

    // The caller has now proven control of this phone, so an address parked by
    // sendOtp can be trusted and promoted. The unique index is re-checked here
    // rather than relying on the check at request time: another account may
    // have claimed the address in the minutes since.
    if (user.pendingEmail) {
      const candidate = user.pendingEmail;
      const emailOwner = await User.findOne({ email: candidate });
      if (!emailOwner || String(emailOwner._id) === String(user._id)) {
        promotedEmail = { from: user.email, fromPlaceholder: user.emailIsPlaceholder };
        user.email = candidate;
        user.emailIsPlaceholder = false;
      }
      // Cleared either way, so an address that was rejected is not silently
      // retried on a later sign-in.
      user.pendingEmail = undefined;
    }

    // Record the applicant's intent only. The "agent" role is deliberately NOT
    // granted here: it is granted when they publish their first listing, so the
    // role always means "has a real listing" rather than "tapped a button".
    if (req.body.intent === "agent") {
      user.agentIntent = true;
    }

    try {
      await user.save();
    } catch (err) {
      // Only the email promotion can trip the unique index, and a lost address
      // is not worth failing a verified sign-in over. The check above is not
      // atomic with this write, so another account can claim the address in
      // between; in that case the address is left as it was and sign-in
      // continues, because the OTP has already been proven.
      if (!err || err.code !== 11000 || !promotedEmail) throw err;

      user.email = promotedEmail.from;
      user.emailIsPlaceholder = promotedEmail.fromPlaceholder;
      await user.save();
    }

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