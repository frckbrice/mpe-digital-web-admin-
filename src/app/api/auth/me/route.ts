import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

/**
 * GET /api/auth/me — same-origin proxy to MPE Web. MPE Web verifies the ID token and returns the user.
 *
 * The browser calls this route (api-client routes /api/auth/me through the proxy). This avoids
 * CORS and "Failed to fetch" when MPE Web is unreachable or does not allow the Admin app's origin.
 *
 * We do NOT verify the token in the Admin app: MPE Web is the single source of truth (Firebase Admin
 * + DB). Verifying here required the Admin app to have FIREBASE_* env vars matching the client's
 * project; misconfiguration (e.g. FIREBASE_PRIVATE_KEY newlines on Vercel, or a different project)
 * caused 401 before the request reached MPE Web.
 *
 * 401: AUTH_HEADER_MISSING | TOKEN_EMPTY (this route) or from MPE Web (_fromUpstream: true).
 * 503: MPE Web unreachable (NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_LOCAL_APP_URL wrong or MPE Web down).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: 'Authorization header missing or invalid. Expected: Bearer <token>.', code: 'AUTH_HEADER_MISSING' },
      { status: 401 }
    );
  }
  console.log('[Admin /auth/me] Incoming Authorization:', authHeader);

  const token = authHeader.substring(7).trim();
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Token is empty.', code: 'TOKEN_EMPTY' },
      { status: 401 }
    );
  }

  const base = getMpeWebAppBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: 'API base URL not set. In production set NEXT_PUBLIC_APP_URL (MPE Web URL). In dev set NEXT_PUBLIC_LOCAL_APP_URL.' },
      { status: 500 }
    );
  }

  const headers: Record<string, string> = {
    Authorization: (token ? `Bearer ${token}` : authHeader), // Pass token explicitly: auth.currentUser can lag briefly after sign-in, so getValidIdToken may be null in apiFetch. Sending the token we just got avoids that race in production.
    'Content-Type': 'application/json',
    'X-Forwarded-From': 'admin-app',
    'X-Admin-Proxy': 'true',
  };

  console.log('api/auth/me: base', base);
  try {
    const res = await fetch(`${base}/api/auth/me`, {
      headers,
    });
    if (!res.ok) {
      const text = await res.text(); // don't parse as JSON yet
      console.error('Response not OK:', res, text);
      return;
    }
    const data = await res.json().catch((e) => {
      console.log('api/auth/me: error', e);
    });
    console.log('api/auth/me: user data', data);
    const out: Record<string, unknown> = { ...data };
    console.log('api/auth/me: res', res);
    if (res.status >= 400) {
      out._fromUpstream = true;
      out._upstreamStatus = res.status;
    }
    console.log('api/auth/me: out', JSON.stringify(out, null, 2));
    return NextResponse.json({ ...out, data, headers }, { status: res.status });
  } catch (e: unknown) {
    console.log('api/auth/me: error', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'MPE_WEB_UNREACHABLE',
        message: `Cannot reach the MPE Web app at ${base}. Is it running? from /api/auth/me. ` + msg,
        detail: msg,
      },
      { status: 503 }
    );
  }
}
