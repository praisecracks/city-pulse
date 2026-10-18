const nodemailer = require("nodemailer");

function getEmailConfig() {
  const { SMTP_HOST, SMTP_PORT = "587", SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const port = Number(SMTP_PORT);

  if (!SMTP_HOST || !SMTP_FROM || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Password reset email is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM.");
  }
  if (Boolean(SMTP_USER) !== Boolean(SMTP_PASS)) {
    throw new Error("SMTP_USER and SMTP_PASS must both be set or both be empty.");
  }

  return {
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    from: SMTP_FROM,
  };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function getResetUrl(token = "token-placeholder") {
  const resetUrl = new URL(process.env.PASSWORD_RESET_URL || "citypulse://reset-password");
  if (resetUrl.protocol !== "https:" && resetUrl.protocol !== "citypulse:") {
    throw new Error("PASSWORD_RESET_URL must use HTTPS or the City Pulse app link.");
  }
  resetUrl.searchParams.set("token", token);
  return resetUrl;
}

function validatePasswordResetEmailConfig() {
  getEmailConfig();
  getResetUrl();
}

async function sendPasswordResetEmail(email, token) {
  const config = getEmailConfig();
  const resetUrl = getResetUrl(token);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Reset your City Pulse password",
    text: [
      "We received a request to reset your City Pulse password.",
      `Open this link within 15 minutes to choose a new password: ${resetUrl.toString()}`,
      "If you did not request this, you can ignore this email.",
    ].join("\n\n"),
    html: `<p>We received a request to reset your City Pulse password.</p><p><a href="${escapeHtml(resetUrl.toString())}">Reset your password</a></p><p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}

module.exports = { sendPasswordResetEmail, validatePasswordResetEmailConfig };
