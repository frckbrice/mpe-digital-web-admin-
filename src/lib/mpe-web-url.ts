/**
 * MPE Web app base URL – server-safe, no Firebase or browser deps.
 * Used by api-client and by /api/auth/* proxy routes.
 */

const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export function getMpeWebAppBaseUrl(): string {
  const local = process.env.NEXT_PUBLIC_LOCAL_APP_URL || '';
  const prod = process.env.NEXT_PUBLIC_APP_URL || '';
  const base = isDev ? (local || prod) : (prod || local);
  return (base || '').replace(/\/$/, '');
}
