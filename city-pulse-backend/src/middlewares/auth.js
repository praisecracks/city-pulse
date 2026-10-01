const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { JWT_SECRET } = require("../config/jwt");

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = header.split(" ")[1];

    // DEV BYPASS: Accept dev tokens in development mode
    if (token.startsWith("dev-token-") && process.env.NODE_ENV === "development") {
      // Read from the body or the query so GET requests can identify the user
      // too. Without an explicit phone, GETs would silently resolve to
      // whichever account was created most recently.
      const phone = req.body?.phone || req.query?.phone;
      let user = null;

      if (phone) {
        const normalizedPhone = phone.startsWith("0") ? phone : "0" + phone.replace(/^234/, "");
        user = await User.findOne({ phone: normalizedPhone, otpVerified: true });
      }

      if (!user && !phone) {
        user = await User.findOne({ otpVerified: true }).sort({ createdAt: -1 }).limit(1);
      }

      if (!user) {
        return res.status(401).json({ success: false, message: "No verified dev user found" });
      }
      req.user = user;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || !user.otpVerified) {
      return res.status(401).json({ success: false, message: "Invalid or unverified user" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = auth;
