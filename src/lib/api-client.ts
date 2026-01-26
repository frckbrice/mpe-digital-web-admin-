// API client for MPE Web app – base URL from APP_URL (prod) or LOCAL_APP_URL (dev)

import { auth } from './firebase/firebase-client';
import { getValidIdToken } from './utils/token-refresh';
import { authLog, authError } from './utils/auth-logger';
import { getMpeWebAppBaseUrl } from './mpe-web-url';

export { getMpeWebAppBaseUrl } from './mpe-web-url';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const base = getMpeWebAppBaseUrl();
  console.log('apiFetch: base', base);
  if (!base) {
    throw new Error(
      'API base URL is not set. In development set NEXT_PUBLIC_LOCAL_APP_URL (e.g. http://localhost:3000). ' +
      'In production set NEXT_PUBLIC_APP_URL. Ensure the MPE Web app is running at that URL.'
    );
  }
  // In the browser, /api/auth/logout|google|profile and /api/admin/*, ... go through same-origin proxy
  // to avoid CORS. /api/auth/me is excluded: the browser calls MPE Web's /api/auth/me directly so the
  // server does not proxy it. MPE Web must allow the Admin app's origin in CORS and allow the
  // Authorization header for /api/auth/me (GET with Bearer token triggers a preflight).
  const p = path.startsWith('/') ? path : '/' + path;
  const useProxy =
    typeof window !== 'undefined' &&
    (/^\/api\/auth\/(logout|google|profile)$/.test(p) ||
      /^\/api\/(admin|agent|documents|messages|quote-requests|notifications)(\/|$)/.test(p));
  const url = useProxy ? p : `${base}${p}`;

  const isAuthPath = path.includes('/auth');
  let token: string | null = null;
  if (auth?.currentUser) {
    try {
      token = await getValidIdToken(false);
      console.log('apiFetch: token', token);
      if (isAuthPath) authLog('apiFetch: token', { path, hasToken: !!token });
    } catch (e) {
      console.log('apiFetch: failed to get auth token', e);
      authError('apiFetch: failed to get auth token', e);
    }
  } else {
    if (isAuthPath) authLog('apiFetch: no currentUser, request without Authorization', { path });
  }

  const headers: Record<string, string> = {};
  // Do not set Content-Type for FormData; browser sets multipart/form-data with boundary.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  // Merge caller headers first. Explicit Authorization from caller (e.g. syncAuthState, useLogin)
  // is kept when getValidIdToken failed, so /api/auth/me does not get 401 for missing header.
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((v, k) => { headers[k] = v; });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([k, v]) => { headers[k] = v; });
    } else {
      Object.assign(headers, options.headers);
    }
  }
  // Prefer caller's explicit Authorization (e.g. useLogin, syncAuthState) over getValidIdToken
  // to avoid overwriting a fresh token with a stale one, especially in production after sign-in.
  if (!headers['Authorization'] && token) headers['Authorization'] = `Bearer ${token}`;

  console.log('apiFetch: url', url);
  console.log('apiFetch: headers', headers);
  console.log('apiFetch: options', { ...options, headers });

  try {
    return await fetch(url, { ...options, headers });
  } catch (e) {
    console.log('apiFetch: failed to fetch', e);
    if (e instanceof TypeError && e.message === 'Failed to fetch') {
      throw new Error(
        `Cannot reach the MPE Web app at ${base}. Is it running? from apiFetch.` + e.message
      );
    }
    throw e;
  }
}
