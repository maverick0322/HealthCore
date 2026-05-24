import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateCode,
} from './authValidation';

// ── validateEmail ─────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('returns null for a valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('returns emailRequired for an empty string', () => {
    expect(validateEmail('')).toBe('validation.emailRequired');
  });

  it('returns emailRequired for whitespace only', () => {
    expect(validateEmail('   ')).toBe('validation.emailRequired');
  });

  it('returns emailInvalid for missing @', () => {
    expect(validateEmail('notanemail')).toBe('validation.emailInvalid');
  });

  it('returns emailInvalid for missing domain', () => {
    expect(validateEmail('user@')).toBe('validation.emailInvalid');
  });

  it('returns emailInvalid for an email with SQL injection attempt', () => {
    expect(validateEmail("' OR 1=1--@example.com")).toBe('validation.emailInvalid');
  });

  it('returns emailInvalid for an email with script injection', () => {
    expect(validateEmail('<script>@example.com')).toBe('validation.emailInvalid');
  });

  it('returns emailTooLong for address > 254 chars', () => {
    const longEmail = 'a'.repeat(245) + '@example.com'; // > 254
    expect(validateEmail(longEmail)).toBe('validation.emailTooLong');
  });

  it('trims leading/trailing whitespace before validating', () => {
    expect(validateEmail('  user@example.com  ')).toBeNull();
  });
});

// ── validatePassword (login mode) ─────────────────────────────────────────────

describe('validatePassword (login mode)', () => {
  it('returns null for a valid 8-char password', () => {
    expect(validatePassword('12345678', 'login')).toBeNull();
  });

  it('returns passwordRequired for empty string', () => {
    expect(validatePassword('', 'login')).toBe('validation.passwordRequired');
  });

  it('returns passwordTooShort for < 8 chars', () => {
    expect(validatePassword('abc', 'login')).toBe('validation.passwordTooShort');
  });

  it('returns passwordTooLong for > 72 chars', () => {
    expect(validatePassword('a'.repeat(73), 'login')).toBe('validation.passwordTooLong');
  });

  it('returns passwordControlChars for input containing tab character', () => {
    expect(validatePassword('valid\t123', 'login')).toBe('validation.passwordControlChars');
  });

  it('returns passwordControlChars for input containing null byte', () => {
    expect(validatePassword('valid\x00123', 'login')).toBe('validation.passwordControlChars');
  });
});

// ── validatePassword (register mode) ─────────────────────────────────────────

describe('validatePassword (register mode)', () => {
  it('returns null for a strong password', () => {
    expect(validatePassword('Secure1!', 'register')).toBeNull();
  });

  it('returns passwordTooShort for < 8 chars', () => {
    expect(validatePassword('Sh0rt!', 'register')).toBe('validation.passwordTooShort');
  });

  it('returns passwordTooLong for > 72 chars', () => {
    expect(validatePassword('a'.repeat(70) + 'A1!', 'register')).toBe('validation.passwordTooLong');
  });

  it('accepts passwords up to 72 characters', () => {
    expect(validatePassword('a'.repeat(69) + 'A1!', 'register')).toBeNull();
  });

  it('returns passwordWeak when no uppercase letter', () => {
    expect(validatePassword('nouppercase1!', 'register')).toBe('validation.passwordWeak');
  });

  it('returns passwordWeak when no lowercase letter', () => {
    expect(validatePassword('NOUPPERCASE1!', 'register')).toBe('validation.passwordWeak');
  });

  it('returns passwordWeak when no digit', () => {
    expect(validatePassword('NoDigitHere!', 'register')).toBe('validation.passwordWeak');
  });

  it('returns passwordWeak when no special character', () => {
    expect(validatePassword('NoSpecial1', 'register')).toBe('validation.passwordWeak');
  });
});

// ── validatePasswordMatch ──────────────────────────────────────────────────────

describe('validatePasswordMatch', () => {
  it('returns null when passwords match', () => {
    expect(validatePasswordMatch('Secret1!', 'Secret1!')).toBeNull();
  });

  it('returns passwordMismatch when passwords differ', () => {
    expect(validatePasswordMatch('Secret1!', 'Different1!')).toBe('validation.passwordMismatch');
  });

  it('returns passwordRequired when confirm is empty', () => {
    expect(validatePasswordMatch('Secret1!', '')).toBe('validation.passwordRequired');
  });
});

// ── validateCode ──────────────────────────────────────────────────────────────

describe('validateCode', () => {
  it('returns null for a valid 6-digit code', () => {
    expect(validateCode('123456')).toBeNull();
  });

  it('returns codeRequired for empty string', () => {
    expect(validateCode('')).toBe('validation.codeRequired');
  });

  it('returns codeInvalid for fewer than 6 digits', () => {
    expect(validateCode('12345')).toBe('validation.codeInvalid');
  });

  it('returns codeInvalid for more than 6 digits', () => {
    expect(validateCode('1234567')).toBe('validation.codeInvalid');
  });

  it('returns codeInvalid for non-numeric characters', () => {
    expect(validateCode('12345a')).toBe('validation.codeInvalid');
  });

  it('returns codeInvalid for injection attempt', () => {
    expect(validateCode("'; DROP TABLE users; --")).toBe('validation.codeInvalid');
  });
});
