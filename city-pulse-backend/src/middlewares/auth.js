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

    // DEV BYPASS: Accept dev tokens in development mode.
    //
    // A dev token carries no identity of its own, so the account has to come
    // from the request. It must be explicit: falling back to "whichever account
    // was created most recently" silently attributed writes to another person —
    // a second provider publishing a listing had it recorded against the first
    // provider's account. Failing loudly is the only safe behaviour for a
    // credential that cannot identify its bearer.
    if (token.startsWith("dev-token-") && process.env.NODE_ENV === "development") {
      const phone = req.body?.phone || req.query?.phone;

      if (!phone) {
        return res.status(401).json({
          success: false,
          message: "Dev tokens must identify the account with a phone number.",
        });
      }

      const normalizedPhone = phone.startsWith("0") ? phone : "0" + phone.replace(/^234/, "");
      const user = await User.findOne({ phone: normalizedPhone, otpVerified: true });

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
