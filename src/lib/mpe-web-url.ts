/**
 * MPE Web app base URL – server-safe, no Firebase or browser deps.
 * Used by api-client and by /api/auth/* proxy routes.
 */

const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export function getMpeWebAppBaseUrl(): string {
  const local = process.env.NEXT_PUBLIC_LOCAL_APP_URL || '';
  const prod = process.env.NEXT_PUBLIC_APP_URL || '';
  const legacy = process.env.NEXT_PUBLIC_MPE_WEB_APP_API_URL || '';
  const base = isDev ? (local || legacy || prod) : (prod || legacy || local);
  return (base || '').replace(/\/$/, '');
}
