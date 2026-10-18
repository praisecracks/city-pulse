const EMAIL_REGEX =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const PHONE_INPUT_REGEX = /^[+()\d\s-]+$/;

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254 && EMAIL_REGEX.test(email);
}

function normalizePhone(phone) {
  if (typeof phone !== "string" || !PHONE_INPUT_REGEX.test(phone)) return null;

  const digits = phone.replace(/\D/g, "");
  let nationalNumber;

  if (digits.startsWith("234") && digits.length === 13) {
    nationalNumber = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 11) {
    nationalNumber = digits.slice(1);
  } else {
    return null;
  }

  if (!/^[789][01]\d{8}$/.test(nationalNumber)) return null;
  return `0${nationalNumber}`;
}

function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 50 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password)
  );
}

module.exports = { normalizeEmail, isValidEmail, normalizePhone, isStrongPassword };
