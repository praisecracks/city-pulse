const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");

/**
 * Attaches the caller's identity when a valid token is present, and does
 * nothing when it is not.
 *
 * The location endpoints are usable before sign-in: the onboarding flow asks
 * for a location before the user has an account, so requiring a token would
 * break a legitimate path through the app.
 *
 * The identity is only used to give a signed-in caller their own rate-limit
 * bucket, so there is no need to load the user document from the database —
 * the token's own `userId` claim is enough, and skipping the lookup keeps the
 * endpoint free of a database round trip.
 */
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  try {
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    // Admin tokens carry `sub`, not `userId`. Only a real user token counts.
    if (decoded?.userId) {
      req.userId = decoded.userId;
    }
  } catch {
    // An invalid or expired token is treated as "not signed in" here. These
    // endpoints work either way, and rejecting the request would break the
    // onboarding flow for a token that simply went stale.
  }

  next();
};

module.exports = optionalAuth;
