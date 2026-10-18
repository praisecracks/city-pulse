const test = require("node:test");
const assert = require("node:assert/strict");
const nodemailer = require("nodemailer");
const { sendPasswordResetEmail } = require("../src/services/emailService");

test("password reset message contains the configured app link and expires securely", async () => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalEnv = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_FROM: process.env.SMTP_FROM,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    PASSWORD_RESET_URL: process.env.PASSWORD_RESET_URL,
  };
  let transportConfig;
  let message;

  try {
    Object.assign(process.env, {
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      SMTP_SECURE: "true",
      SMTP_FROM: "City Pulse <no-reply@example.com>",
      SMTP_USER: "smtp-user",
      SMTP_PASS: "smtp-password",
      PASSWORD_RESET_URL: "citypulse://reset-password",
    });
    nodemailer.createTransport = (config) => {
      transportConfig = config;
      return { sendMail: async (mail) => { message = mail; } };
    };

    const token = "f".repeat(64);
    await sendPasswordResetEmail("neighbor@example.com", token);

    assert.equal(transportConfig.host, "smtp.example.com");
    assert.equal(transportConfig.port, 465);
    assert.equal(transportConfig.secure, true);
    assert.deepEqual(transportConfig.auth, { user: "smtp-user", pass: "smtp-password" });
    assert.equal(message.from, "City Pulse <no-reply@example.com>");
    assert.equal(message.to, "neighbor@example.com");
    assert.match(message.text, new RegExp(`citypulse://reset-password\\?token=${token}`));
    assert.match(message.html, new RegExp(`citypulse://reset-password\\?token=${token}`));
    assert.match(message.text, /15 minutes/);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
