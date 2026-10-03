/**
 * Role gate. Must run after `auth`, which is what populates req.user.
 *
 * Per-listing ownership only covers "is this your listing". Anything that is
 * customer-only (reporting) or provider-only needs this so the rule holds even
 * if a client is bypassed.
 *
 * Roles are read off the live user document rather than the JWT payload on
 * purpose: the agent role is granted at publish time (createPulse), long after
 * the token was signed, so a token's own roles claim goes stale.
 */
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const userRoles = req.user.roles || [];

    // A single account can hold both roles (PRD 6.3), so this is a membership
    // test rather than an equality test.
    if (!roles.some((role) => userRoles.includes(role))) {
      return res.status(403).json({
        success: false,
        message: `This action is limited to: ${roles.join(", ")}`,
      });
    }

    next();
  };

module.exports = requireRole;
