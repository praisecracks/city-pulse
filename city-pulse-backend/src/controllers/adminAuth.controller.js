const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");

/**
 * Admin authentication.
 *
 * A single admin account is configured via environment variables. There is no
 * registration flow, no password reset, and no second admin — this is a small
 * internal dashboard, not a multi-tenant product.
 *
 * ADMIN_EMAIL   — the only email that can log in.
 * ADMIN_PASSWORD — the matching password.
 *
 * If neither is set, random values are generated and logged so a developer
 * can still log in during local work without configuring anything.
 */

let ADMIN_EMAIL = process.env.ADMIN_EMAIL || null;
let ADMIN_PASSWORD_HASH = null;
let ADMIN_PASSWORD_SALT = null;

function ensureAdminCreds() {
  if (ADMIN_EMAIL && ADMIN_PASSWORD_HASH) return;

  if (!ADMIN_EMAIL) {
    ADMIN_EMAIL = `admin-${crypto.randomBytes(4).toString("hex")}@citypulse.local`;
  }
  if (!process.env.ADMIN_PASSWORD) {
    const password = crypto.randomBytes(12).toString("base64url");
    console.warn(`[admin] No ADMIN_PASSWORD set. Generated: ${password}`);
    process.env.ADMIN_PASSWORD = password;
  }
  ADMIN_PASSWORD_SALT = crypto.randomBytes(16).toString("hex");
  ADMIN_PASSWORD_HASH = hashPassword(process.env.ADMIN_PASSWORD, ADMIN_PASSWORD_SALT);

  console.log(`[admin] Admin login: ${ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password) {
  if (!ADMIN_PASSWORD_HASH) ensureAdminCreds();
  const hash = crypto.scryptSync(password, ADMIN_PASSWORD_SALT, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(ADMIN_PASSWORD_HASH));
}

function signAdminToken() {
  return jwt.sign(
    { role: "admin", sub: "admin" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

/**
 * POST /api/v1/admin/login
 * Body: { email, password }
 * Returns: { success, data: { token, email } }
 */
async function login(req, res, next) {
  try {
    ensureAdminCreds();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const emailOk = safeCompare(String(email).toLowerCase(), ADMIN_EMAIL.toLowerCase());
    const passOk = verifyPassword(password);

    if (!emailOk || !passOk) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = signAdminToken();
    res.status(200).json({
      success: true,
      data: { token, email: ADMIN_EMAIL },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Constant-time string comparison.
 *
 * crypto.timingSafeEqual requires equal-length buffers, so both inputs are
 * padded to the longer length. This keeps the timing attack surface flat
 * regardless of how much of the secret the caller got right.
 */
function safeCompare(a, b) {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  const len = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(len, 0);
  const paddedB = Buffer.alloc(len, 0);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  return crypto.timingSafeEqual(paddedA, paddedB);
}

module.exports = { login, ensureAdminCreds };