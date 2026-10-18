const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEmail,
  isValidEmail,
  normalizePhone,
  isStrongPassword,
} = require("../src/utils/auth-validation");

test("normalizes email addresses and accepts local parts containing digits", () => {
  assert.equal(normalizeEmail("  User123@example.com "), "user123@example.com");
  assert.equal(isValidEmail("user123@example.com"), true);
  assert.equal(isValidEmail("user@example"), false);
});

test("normalizes supported Nigerian phone formats to the local format", () => {
  assert.equal(normalizePhone("0803 123 4567"), "08031234567");
  assert.equal(normalizePhone("+234 803 123 4567"), "08031234567");
  assert.equal(normalizePhone("abc08031234567"), null);
  assert.equal(normalizePhone("0803 123 456"), null);
});

test("requires all configured password character classes", () => {
  assert.equal(isStrongPassword("Strong#123"), true);
  assert.equal(isStrongPassword("weakpass1"), false);
  assert.equal(isStrongPassword("Short#1"), false);
  assert.equal(isStrongPassword("Strong 123"), false);
  assert.equal(isStrongPassword(`Strong#${"1".repeat(45)}`), false);
});
