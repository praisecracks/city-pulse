const test = require("node:test");
const assert = require("node:assert/strict");
const errorHandler = require("../src/middlewares/errorHandler");

test("production server errors do not expose internal exception messages", () => {
  const previousEnvironment = process.env.NODE_ENV;
  const originalConsoleError = console.error;
  process.env.NODE_ENV = "production";
  console.error = () => {};

  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  try {
    errorHandler(new Error("MongoDB internal details"), {}, response, () => {});

    assert.equal(response.statusCode, 500);
    assert.equal(
      response.body.message,
      "Something went wrong on the server. Please try again.",
    );
    assert.equal(response.body.stack, undefined);
  } finally {
    process.env.NODE_ENV = previousEnvironment;
    console.error = originalConsoleError;
  }
});
