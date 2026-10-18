const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user.model");
const emailService = require("../src/services/emailService");
const { forgotPassword, resetPassword } = require("../src/controllers/auth.controller");

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function runController(handler, body) {
  const response = createResponse();
  let nextError;
  await handler({ body }, response, (error) => {
    nextError = error;
  });
  if (nextError) throw nextError;
  return response;
}

test("forgot-password emails a raw token but only stores its hash", async () => {
  const originalFindOne = User.findOne;
  const originalValidateConfig = emailService.validatePasswordResetEmailConfig;
  const originalSendEmail = emailService.sendPasswordResetEmail;
  const originalEnv = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_FROM: process.env.SMTP_FROM,
  };
  let sentEmail;
  let savedUser;
  const user = {
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
    async save() {
      savedUser = {
        resetPasswordToken: this.resetPasswordToken,
        resetPasswordExpires: this.resetPasswordExpires,
      };
    },
  };

  try {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_FROM = "City Pulse <no-reply@example.com>";
    emailService.validatePasswordResetEmailConfig = () => {};
    User.findOne = async (query) => {
      assert.deepEqual(query, { email: "neighbor@example.com" });
      return user;
    };
    emailService.sendPasswordResetEmail = async (email, token) => {
      sentEmail = { email, token };
    };

    const response = await runController(forgotPassword, { email: " Neighbor@Example.com " });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(sentEmail.email, "neighbor@example.com");
    assert.match(sentEmail.token, /^[a-f\d]{64}$/);
    assert.equal(
      savedUser.resetPasswordToken,
      crypto.createHash("sha256").update(sentEmail.token).digest("hex"),
    );
    assert.notEqual(savedUser.resetPasswordToken, sentEmail.token);
    assert.ok(savedUser.resetPasswordExpires.getTime() > Date.now());
    assert.ok(savedUser.resetPasswordExpires.getTime() <= Date.now() + 15 * 60 * 1000);
  } finally {
    User.findOne = originalFindOne;
    emailService.validatePasswordResetEmailConfig = originalValidateConfig;
    emailService.sendPasswordResetEmail = originalSendEmail;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("unknown accounts receive the same generic forgot-password response", async () => {
  const originalFindOne = User.findOne;
  const originalValidateConfig = emailService.validatePasswordResetEmailConfig;
  const originalSendEmail = emailService.sendPasswordResetEmail;
  let emailWasSent = false;

  try {
    emailService.validatePasswordResetEmailConfig = () => {};
    User.findOne = async () => null;
    emailService.sendPasswordResetEmail = async () => {
      emailWasSent = true;
    };
    const response = await runController(forgotPassword, { email: "unknown@example.com" });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.message, "If the email exists, a reset link has been sent");
    assert.equal(emailWasSent, false);
  } finally {
    User.findOne = originalFindOne;
    emailService.validatePasswordResetEmailConfig = originalValidateConfig;
    emailService.sendPasswordResetEmail = originalSendEmail;
  }
});

test("missing SMTP configuration returns a service error without looking up accounts", async () => {
  const originalFindOne = User.findOne;
  const originalValidateConfig = emailService.validatePasswordResetEmailConfig;
  const originalError = console.error;

  try {
    User.findOne = async () => {
      throw new Error("Account lookup must not run without reset email configuration");
    };
    emailService.validatePasswordResetEmailConfig = () => {
      throw new Error("SMTP settings are missing");
    };
    console.error = () => {};

    const response = await runController(forgotPassword, { email: "neighbor@example.com" });

    assert.equal(response.statusCode, 503);
    assert.equal(response.body.success, false);
  } finally {
    User.findOne = originalFindOne;
    emailService.validatePasswordResetEmailConfig = originalValidateConfig;
    console.error = originalError;
  }
});

test("failed delivery invalidates the reset token and returns a service error", async () => {
  const originalFindOne = User.findOne;
  const originalValidateConfig = emailService.validatePasswordResetEmailConfig;
  const originalSendEmail = emailService.sendPasswordResetEmail;
  const originalError = console.error;
  let saveCount = 0;
  const user = {
    async save() {
      saveCount += 1;
    },
  };

  try {
    emailService.validatePasswordResetEmailConfig = () => {};
    User.findOne = async () => user;
    emailService.sendPasswordResetEmail = async () => {
      throw new Error("SMTP unavailable");
    };
    console.error = () => {};

    const response = await runController(forgotPassword, { email: "neighbor@example.com" });

    assert.equal(response.statusCode, 503);
    assert.equal(user.resetPasswordToken, undefined);
    assert.equal(user.resetPasswordExpires, undefined);
    assert.equal(saveCount, 2);
  } finally {
    User.findOne = originalFindOne;
    emailService.validatePasswordResetEmailConfig = originalValidateConfig;
    emailService.sendPasswordResetEmail = originalSendEmail;
    console.error = originalError;
  }
});

test("reset-password looks up the token hash and consumes the token", async () => {
  const originalFindOne = User.findOne;
  const rawToken = crypto.randomBytes(32).toString("hex");
  const user = {
    password: undefined,
    resetPasswordToken: crypto.createHash("sha256").update(rawToken).digest("hex"),
    resetPasswordExpires: new Date(Date.now() + 60_000),
    async save() {},
  };

  try {
    User.findOne = (query) => ({
      select: async (fields) => {
        assert.equal(query.resetPasswordToken, user.resetPasswordToken);
        assert.ok(query.resetPasswordExpires.$gt instanceof Date);
        assert.equal(fields, "+password +resetPasswordToken +resetPasswordExpires");
        return user;
      },
    });
    const response = await runController(resetPassword, {
      token: rawToken,
      password: "NewStrong#123",
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.ok(await bcrypt.compare("NewStrong#123", user.password));
    assert.equal(user.resetPasswordToken, undefined);
    assert.equal(user.resetPasswordExpires, undefined);
  } finally {
    User.findOne = originalFindOne;
  }
});
