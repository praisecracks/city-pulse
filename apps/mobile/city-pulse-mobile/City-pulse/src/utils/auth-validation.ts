const EMAIL_REGEX =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const PHONE_INPUT_REGEX = /^[+()\d\s-]+$/;
const NIGERIAN_MOBILE_REGEX = /^[789][01]\d{8}$/;

export function isValidEmailAddress(email: string): boolean {
  return email.length <= 254 && EMAIL_REGEX.test(email);
}

export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  if (digits.startsWith('234') && digits.length === 13) {
    return digits;
  }
  return '';
}

export function isValidNigerianPhoneNumber(phone: string): boolean {
  if (!PHONE_INPUT_REGEX.test(phone)) return false;

  const normalized = normalizePhoneNumber(phone);
  return normalized.length === 13 && NIGERIAN_MOBILE_REGEX.test(normalized.slice(3));
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    password.length <= 50 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password)
  );
}
