// Resolved once here and imported everywhere. The controller and the auth
// middleware must sign and verify with the same value or every token fails
// verification with no obvious config error.
const DEV_FALLBACK_SECRET = "city-pulse-default-secret";

const isProduction = process.env.NODE_ENV === "production";
const secret = process.env.JWT_SECRET;

// Silently falling back to a known secret in production would let anyone forge
// a provider token, so the process refuses to start instead.
if (!secret && isProduction) {
  throw new Error("JWT_SECRET must be set in your .env file when NODE_ENV=production");
}

const JWT_SECRET = secret || DEV_FALLBACK_SECRET;

if (!secret) {
  console.warn(
    "[auth] JWT_SECRET is not set — falling back to the development secret. Do not use this in production."
  );
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, DEV_FALLBACK_SECRET };
