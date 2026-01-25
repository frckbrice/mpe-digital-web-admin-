/**
 * Auth logger – use [Auth] prefix so logs can be filtered in DevTools.
 * All logs (authLog, authWarn, authError) run only in development.
 */

const isDev =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export function authLog(message: string, data?: Record<string, unknown>): void {
  if (isDev) {
    if (data != null) {
      console.log('[Auth]', message, data);
    } else {
      console.log('[Auth]', message);
    }
  }
}

export function authWarn(message: string, err?: unknown): void {
  if (isDev) {
    console.warn('[Auth]', message, err ?? '');
  }
}

export function authError(message: string, err?: unknown): void {
  const payload = err instanceof Error ? err.message : (err != null ? String(err) : '');
  if (isDev) {
    console.error('[Auth]', message, err ?? '');
  } else if (payload) {
    // In production, log the error message to the console so it can be inspected in browser DevTools
    console.error('[Auth]', message, payload);
  }
}
