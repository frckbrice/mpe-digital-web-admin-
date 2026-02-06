/**
 * MPE Web app base URL – server-safe, no Firebase or browser deps.
 * Used by api-client and by /api/auth/* proxy routes.
 */

export function getMpeWebAppBaseUrl() {
  // Local dev
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_LOCAL_APP_URL;
  }

  // Preview deployments
  if (process.env.VERCEL_ENV === 'preview') {
    return process.env.NEXT_PUBLIC_PREVIEW_APP_URL;
  }

  // Production
  return process.env.NEXT_PUBLIC_APP_URL;
}
