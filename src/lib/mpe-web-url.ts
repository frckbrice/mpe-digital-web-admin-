/**
 * MPE Web app base URL – server-safe, no Firebase or browser deps.
 * Used by api-client and by /api/auth/* proxy routes.
 */

const isDev = process.env.NODE_ENV === 'development';

export function getMpeWebAppBaseUrl(): string {
  const local = process.env.NEXT_PUBLIC_LOCAL_APP_URL || '';
  const prod = process.env.NEXT_PUBLIC_APP_URL || '';
  const base = isDev ? local : prod;
  return (base || '').replace(/\/$/, '');
}
