/**
 * Pure validation functions for the auth domain (identity-service).
 * All functions return a translation key string on failure, or null on success.
 * Keys are resolved by the caller via useTranslation('auth').
 */

/** RFC 5322 simplified — rejects most injections and malformed addresses. */
const EMAIL_REGEX = /^[^\s@<>'"`;,]+@[^\s@<>'"`;,]+\.[^\s@<>'"`;,]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

/** 6 numeric digits exactly. */
const CODE_REGEX = /^\d{6}$/;

/** No ASCII control characters (0x00–0x1F, 0x7F). */
const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;

// ── Email ────────────────────────────────────────────────────────────────────

export const validateEmail = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return 'validation.emailRequired';
  if (trimmed.length > MAX_EMAIL_LENGTH) return 'validation.emailTooLong';
  if (!EMAIL_REGEX.test(trimmed)) return 'validation.emailInvalid';
  return null;
};

// ── Password ─────────────────────────────────────────────────────────────────

/**
 * Login mode: minimal check — just length + no control chars (server validates the rest).
 * Register/reset mode: enforces strong password policy matching the backend rules.
 */
export const validatePassword = (
  value: string,
  mode: 'login' | 'register',
): string | null => {
  if (!value) return 'validation.passwordRequired';
  if (CONTROL_CHAR_REGEX.test(value)) return 'validation.passwordControlChars';

  if (mode === 'login') {
    if (value.length < 8) return 'validation.passwordTooShort';
    if (value.length > 72) return 'validation.passwordTooLong';
    return null;
  }

  // Register / reset
  if (value.length < 8) return 'validation.passwordTooShort';
  if (value.length > 15) return 'validation.passwordTooLong';
  if (!/[A-Z]/.test(value)) return 'validation.passwordWeak';
  if (!/[0-9]/.test(value)) return 'validation.passwordWeak';
  if (!/[^A-Za-z0-9]/.test(value)) return 'validation.passwordWeak';
  return null;
};

// ── Password confirmation ─────────────────────────────────────────────────────

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string,
): string | null => {
  if (!confirmPassword) return 'validation.passwordRequired';
  if (password !== confirmPassword) return 'validation.passwordMismatch';
  return null;
};

// ── 6-digit verification code ────────────────────────────────────────────────

export const validateCode = (value: string): string | null => {
  if (!value) return 'validation.codeRequired';
  if (!CODE_REGEX.test(value)) return 'validation.codeInvalid';
  return null;
};
