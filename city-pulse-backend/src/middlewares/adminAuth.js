const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");

/**
 * Middleware: require a valid admin JWT.
 *
 * Runs after the standard `auth` middleware is not needed here — this one
 * verifies its own token and checks the `role` claim is "admin".
 *
 * The token is signed by adminAuth.controller.login with { role: "admin" }.
 */
const adminAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    req.admin = { role: "admin", sub: decoded.sub };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = adminAuth;