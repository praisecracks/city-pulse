const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user.model");
const { signUp, signIn } = require("../src/controllers/auth.controller");

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

test("new accounts remain unverified and can sign in with phone or email", async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  let createdUser;

  try {
    User.findOne = async () => null;
    User.create = async (user) => {
      createdUser = user;
      return { _id: "new-user-id", ...user };
    };

    const signup = await runController(signUp, {
      name: "Test Neighbor",
      email: "neighbor123@example.com",
      phone: "+234 803 123 4567",
      password: "Strong#123",
    });

    assert.equal(signup.statusCode, 201);
    assert.equal(signup.body.success, true);
    assert.equal(signup.body.message, "Account created. Please sign in.");
    assert.equal(createdUser.email, "neighbor123@example.com");
    assert.equal(createdUser.phone, "08031234567");
    assert.equal(createdUser.otpVerified, false);
    assert.equal(createdUser.isVerified, false);

    const storedUser = {
      _id: "new-user-id",
      name: "Test Neighbor",
      email: "neighbor123@example.com",
      phone: "08031234567",
      password: await bcrypt.hash("Strong#123", 10),
      otpVerified: false,
      isVerified: false,
      roles: ["customer"],
    };
    User.findOne = (query) => ({
      select: async () => {
        assert.deepEqual(query, { phone: "08031234567" });
        return storedUser;
      },
    });

    const signin = await runController(signIn, {
      identifier: "+234 803 123 4567",
      password: "Strong#123",
    });

    assert.equal(signin.statusCode, 200);
    assert.equal(signin.body.success, true);
    assert.equal(signin.body.data.user.otpVerified, false);
    assert.equal(signin.body.data.user.isVerified, false);
    assert.equal(typeof signin.body.data.token, "string");

    User.findOne = (query) => ({
      select: async () => {
        assert.deepEqual(query, { email: "neighbor123@example.com" });
        return storedUser;
      },
    });

    const emailSignin = await runController(signIn, {
      identifier: " Neighbor123@Example.com ",
      password: "Strong#123",
    });
    assert.equal(emailSignin.statusCode, 200);
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  }
});
