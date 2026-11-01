/**
 * Normalizes an Indian mobile phone number:
 * - Strips whitespace, hyphens, dots, parentheses
 * - Strips leading '+91', '91' (when 12 digits), or '0' (when 11 digits)
 * - Validates that the result is exactly 10 digits
 */
export function normalizePhoneNumber(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Phone number is required.' };
  }

  let cleaned = input.trim();
  // Remove whitespace, dashes, dots, parentheses
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }

  if (!/^\d{10}$/.test(cleaned)) {
    return {
      valid: false,
      error: 'Please enter a valid 10-digit mobile number (e.g., 9876543210 or +91 98765-43210).'
    };
  }

  return { valid: true, phone: cleaned };
}

/**
 * Normalizes an identifier entered in the Login form:
 * - If it consists of digits or phone formatting characters (+, -, spaces, parentheses),
 *   it is treated as a mobile number and validated/normalized to 10 digits.
 * - If it contains letters (e.g. 'admin', 'farmer', 'mandi_officer'),
 *   it is treated as a standard username.
 */
export function normalizeLoginIdentifier(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Username or mobile number is required.' };
  }
  const trimmed = input.trim();

  // If the identifier contains only digits, +, -, (, ), ., and spaces, and at least one digit:
  const isPhoneLike = /^[+]?[\d\s\-().]+$/.test(trimmed) && /\d/.test(trimmed);
  if (isPhoneLike) {
    const res = normalizePhoneNumber(trimmed);
    if (!res.valid) {
      return { valid: false, error: res.error, value: trimmed };
    }
    return { valid: true, isPhone: true, value: res.phone };
  }

  return { valid: true, isPhone: false, value: trimmed };
}
