import { describe, it, expect } from 'vitest';
import { sanitizeFirebaseError, sanitizeError, FIREBASE_ERROR_KEYS } from './error-sanitizer';

describe('error-sanitizer', () => {
  describe('sanitizeFirebaseError', () => {
    it('returns default for null/undefined', () => {
      expect(sanitizeFirebaseError(null)).toBe('An unexpected error occurred');
      expect(sanitizeFirebaseError(undefined)).toBe('An unexpected error occurred');
    });

    it('maps known Firebase codes to safe messages', () => {
      const err = Object.assign(new Error('auth'), { code: 'auth/invalid-credential' });
      expect(sanitizeFirebaseError(err)).toBe('Invalid email or password');
      const err2 = Object.assign(new Error('auth'), { code: 'auth/too-many-requests' });
      expect(sanitizeFirebaseError(err2)).toBe('Too many requests. Please try again later');
    });

    it('strips stack traces and file paths', () => {
      const err = new Error('Error at /Users/dev/src/index.ts (line 42)');
      expect(sanitizeFirebaseError(err)).toBe('An error occurred while processing your request');
    });

    it('truncates very long messages', () => {
      const long = 'x'.repeat(300);
      expect(sanitizeFirebaseError(new Error(long))).toBe(
        'An error occurred while processing your request'
      );
    });

    it('handles plain object with code and message', () => {
      expect(sanitizeFirebaseError({ code: 'auth/user-not-found', message: 'x' })).toBe(
        'No account found with this email'
      );
    });

    it('handles string input', () => {
      expect(sanitizeFirebaseError('short')).toBe('short');
      expect(sanitizeFirebaseError('x'.repeat(250))).toBe(
        'An error occurred while processing your request'
      );
    });
  });

  describe('sanitizeError', () => {
    it('returns default for null/undefined', () => {
      expect(sanitizeError(null)).toBe('An error occurred');
      expect(sanitizeError(undefined, 'Custom')).toBe('Custom');
    });

    it('strips internal paths and stack-like content', () => {
      expect(sanitizeError(new Error('at Object.<anonymous> (node_modules/x/index.js:1:1)'))).toBe(
        'An error occurred'
      );
      expect(sanitizeError(new Error('Something in src/lib/foo.ts'))).toBe('An error occurred');
    });

    it('hides database/connection details', () => {
      expect(sanitizeError(new Error('ECONNREFUSED 127.0.0.1'))).toBe('An error occurred');
      expect(sanitizeError(new Error('Invalid DATABASE_URL'))).toBe('An error occurred');
    });

    it('returns short safe messages as-is', () => {
      expect(sanitizeError(new Error('Validation failed'))).toBe('Validation failed');
    });
  });

  describe('FIREBASE_ERROR_KEYS', () => {
    it('has i18n keys for critical auth errors', () => {
      expect(FIREBASE_ERROR_KEYS['auth/invalid-credential']).toBe(
        'login.errors.auth_invalid_credential'
      );
      expect(FIREBASE_ERROR_KEYS['auth/too-many-requests']).toBeDefined();
    });
  });
});
