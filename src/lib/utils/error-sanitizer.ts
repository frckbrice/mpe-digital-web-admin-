/**
 * Error Sanitization Utility
 * Sanitizes error messages before exposing them to clients.
 */

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-exists': 'An account with this email already exists',
  'auth/invalid-email': 'Invalid email address',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/weak-password': 'Password is too weak',
  'auth/invalid-credential': 'Invalid email or password',
  'auth/invalid-verification-code': 'Invalid verification code',
  'auth/invalid-verification-id': 'Invalid verification ID',
  'auth/code-expired': 'Verification code has expired',
  'auth/operation-not-allowed': 'This operation is not allowed',
  'auth/too-many-requests': 'Too many requests. Please try again later',
  'auth/user-disabled': 'This account has been disabled',
  'auth/user-token-expired': 'Your session has expired. Please log in again',
  'auth/id-token-expired': 'Your session has expired. Please log in again',
  'auth/argument-error': 'Invalid authentication token',
  'auth/invalid-id-token': 'Invalid authentication token',
  'auth/session-cookie-expired': 'Your session has expired. Please log in again',
  'auth/insufficient-permission': 'You do not have permission to perform this action',
  'auth/internal-error': 'An internal error occurred. Please try again later',
  'auth/configuration-not-found': 'Google Sign-In is not configured.',
  'auth/popup-blocked': 'Popup was blocked. Please allow popups and try again.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/cancelled-popup-request': 'Only one sign-in request at a time. Please wait and try again.',
  'auth/unauthorized-domain': 'This domain is not authorized.',
  'app/no-app': 'Firebase application not initialized',
  'app/duplicate-app': 'Firebase application already initialized',
};

export function sanitizeFirebaseError(error: unknown): string {
  if (!error) return 'An unexpected error occurred';

  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (code && FIREBASE_ERROR_MESSAGES[code]) return FIREBASE_ERROR_MESSAGES[code];
    const message = error.message || '';
    if (message.includes('at ') && message.includes('(')) return 'An error occurred while processing your request';
    if (message.includes('/') && (message.includes('node_modules') || message.includes('src/'))) return 'An error occurred while processing your request';
    if (message.toLowerCase().includes('internal') || message.toLowerCase().includes('stack') || message.toLowerCase().includes('trace')) return 'An internal error occurred. Please try again later';
    return message.length > 200 ? 'An error occurred while processing your request' : message;
  }

  if (typeof error === 'object' && error !== null) {
    const o = error as { code?: string; message?: string };
    if (o.code && FIREBASE_ERROR_MESSAGES[o.code]) return FIREBASE_ERROR_MESSAGES[o.code];
    if (o.message && typeof o.message === 'string') return sanitizeFirebaseError(new Error(o.message));
  }

  if (typeof error === 'string') return error.length > 200 ? 'An error occurred while processing your request' : error;
  return 'An unexpected error occurred';
}

export function sanitizeError(error: unknown, defaultMessage = 'An error occurred'): string {
  if (!error) return defaultMessage;
  if (error instanceof Error) {
    const message = error.message || '';
    if (message.includes('at ') && message.includes('(')) return defaultMessage;
    if (message.includes('/') && (message.includes('node_modules') || message.includes('src/') || message.includes('dist/') || message.includes('build/'))) return defaultMessage;
    if (message.toLowerCase().includes('internal') || message.toLowerCase().includes('stack') || message.toLowerCase().includes('trace') || message.toLowerCase().includes('prisma') || message.toLowerCase().includes('database')) return defaultMessage;
    if (message.includes('ECONNREFUSED') || message.includes('DATABASE_URL')) return defaultMessage;
    return message.length > 200 ? defaultMessage : message;
  }
  if (typeof error === 'object' && error !== null) {
    const o = error as { message?: string };
    if (o.message && typeof o.message === 'string') return sanitizeError(new Error(o.message), defaultMessage);
  }
  if (typeof error === 'string') return error.length > 200 ? defaultMessage : error;
  return defaultMessage;
}

export function getSafeErrorMessage(
  error: unknown,
  defaultMessage = 'An error occurred'
): { message: string } {
  const isFirebase = error && typeof error === 'object' && 'code' in error && String((error as { code?: string }).code || '').startsWith('auth/');
  const message = isFirebase ? sanitizeFirebaseError(error) : sanitizeError(error, defaultMessage);
  return { message };
}

/**
 * Extracts a user-visible error message from API JSON responses.
 * Uses message, error, and detail so real server messages surface in toasts/console.
 */
export function getApiErrorPayload(
  obj: Record<string, unknown> | null | undefined,
  fallback: string
): string {
  if (!obj || typeof obj !== 'object') return fallback;
  const m = obj.message;
  const e = obj.error;
  const d = obj.detail;
  if (typeof m === 'string' && m.trim()) return m;
  if (typeof e === 'string' && e.trim()) return typeof d === 'string' && d.trim() ? `${e}: ${d}` : e;
  if (typeof d === 'string' && d.trim()) return d;
  return fallback;
}
