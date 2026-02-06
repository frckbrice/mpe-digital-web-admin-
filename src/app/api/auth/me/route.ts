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
      {
        success: false,
        message: 'Authorization header missing or invalid.',
        code: 'AUTH_HEADER_MISSING',
      },
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

  const base = getMpeWebAppBaseUrl();
  if (!base) {
    return NextResponse.json({ error: 'API base URL not set.', status: 500 }, { status: 500 });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Forwarded-From': 'admin-app',
    'X-Admin-Proxy': 'true',
    origin: base,
  };

  try {
    const res = await fetch(`${base}/api/auth/me`, { headers });
    let data: Record<string, unknown> = {};
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      data = await res.json();
      console.log('api/auth/me: data', data);
    } else {
      const text = await res.text();
      console.warn('Non-JSON response from upstream:', text.substring(0, 500));
      data.message = `Upstream returned non-JSON content.`;
    }

    const out: Record<string, unknown> = { ...data };
    if (!res.ok) {
      out._fromUpstream = true;
      out._upstreamStatus = res.status;
    }

    return NextResponse.json({ ...out, data }, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: 'MPE_WEB_UNREACHABLE', message: `Cannot reach ${base}`, detail: msg },
      { status: 503 }
    );
  }
}
