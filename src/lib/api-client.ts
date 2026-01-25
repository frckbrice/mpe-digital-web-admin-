// API client for MPE Web app – base URL from APP_URL (prod) or LOCAL_APP_URL (dev)

import { auth } from './firebase/firebase-client';
import { getValidIdToken } from './utils/token-refresh';
import { authLog, authError } from './utils/auth-logger';
import { getMpeWebAppBaseUrl } from './mpe-web-url';

export { getMpeWebAppBaseUrl } from './mpe-web-url';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const base = getMpeWebAppBaseUrl();
  if (!base) {
    throw new Error(
      'API base URL is not set. In development set NEXT_PUBLIC_LOCAL_APP_URL (e.g. http://localhost:3000). ' +
      'In production set NEXT_PUBLIC_APP_URL. Ensure the MPE Web app is running at that URL.'
    );
  }
  // In the browser, /api/auth/* and /api/admin/* go through same-origin proxy to avoid CORS and "Failed to fetch" when MPE Web runs on another port.
  const p = path.startsWith('/') ? path : '/' + path;
  const useProxy = typeof window !== 'undefined' && (/^\/api\/auth\/(me|logout|google|profile)$/.test(p) || p.startsWith('/api/admin/'));
  const url = useProxy ? p : `${base}${p}`;

  const isAuthPath = path.includes('/auth');
  let token: string | null = null;
  if (auth?.currentUser) {
    try {
      token = await getValidIdToken(false);
      if (isAuthPath) authLog('apiFetch: token', { path, hasToken: !!token });
    } catch (e) {
      authError('apiFetch: failed to get auth token', e);
    }
  } else {
    if (isAuthPath) authLog('apiFetch: no currentUser, request without Authorization', { path });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((v, k) => { headers[k] = v; });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([k, v]) => { headers[k] = v; });
    } else {
      Object.assign(headers, options.headers);
    }
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    return await fetch(url, { ...options, headers });
  } catch (e) {
    if (e instanceof TypeError && e.message === 'Failed to fetch') {
      throw new Error(
        `Cannot reach the MPE Web app at ${base}. Is it running? In development, start the MPE Web app (e.g. pnpm dev on port 3000).`
      );
    }
    throw e;
  }
}
