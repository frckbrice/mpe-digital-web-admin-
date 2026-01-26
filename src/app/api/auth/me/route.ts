import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';
import { adminAuth } from '@/lib/firebase/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me — server-side proxy to MPE Web (verifies ID token, then fetches user from MPE Web).
 *
 * The login and syncAuthState flows call MPE Web's /api/auth/me directly from the browser
 * (see api-client: /api/auth/me is excluded from the same-origin proxy). This route remains
 * for server-side or legacy callers that hit the Admin app's /api/auth/me.
 *
 * If Firebase Admin is not configured, only proxies (MPE Web does verification).
 * 401: AUTH_HEADER_MISSING | TOKEN_EMPTY | TOKEN_INVALID (this route) or from MPE Web (_fromUpstream: true).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: 'Authorization header missing or invalid. Expected: Bearer <token>.', code: 'AUTH_HEADER_MISSING' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Token is empty.', code: 'TOKEN_EMPTY' },
      { status: 401 }
    );
  }

  // Verify ID token with firebase-admin when available (same as MPE Web app)
  if (adminAuth) {
    try {
      await adminAuth.verifyIdToken(token);
    } catch (verifyError: unknown) {
      const message = verifyError instanceof Error ? verifyError.message : 'Invalid or expired token';
      return NextResponse.json(
        {
          success: false,
          message: `${message} In production, ensure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY (with \\n as literal newlines), and FIREBASE_CLIENT_EMAIL match the Firebase project used by the client.`,
          code: 'TOKEN_INVALID',
        },
        { status: 401 }
      );
    }
  }

  const base = getMpeWebAppBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: 'API base URL not set. In production set NEXT_PUBLIC_APP_URL (MPE Web URL). In dev set NEXT_PUBLIC_LOCAL_APP_URL.' },
      { status: 500 }
    );
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: authHeader };

  try {
    const res = await fetch(`${base}/api/auth/me`, { headers });
    const data = await res.json().catch(() => ({}));
    const out: Record<string, unknown> = { ...data };
    if (res.status >= 400) {
      out._fromUpstream = true;
      out._upstreamStatus = res.status;
    }
    return NextResponse.json(out, { status: res.status });
  } catch (e: unknown) {
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
