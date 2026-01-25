import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';
import { adminAuth } from '@/lib/firebase/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Handles GET /api/auth/me like MPE Web app: verifies the Firebase ID token with firebase-admin,
 * then proxies to MPE Web to resolve the user from the database.
 * If Firebase Admin is not configured, only proxies (MPE Web does verification).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  // Verify ID token with firebase-admin when available (same as MPE Web app)
  if (adminAuth) {
    try {
      await adminAuth.verifyIdToken(token);
    } catch (verifyError: unknown) {
      const message = verifyError instanceof Error ? verifyError.message : 'Invalid or expired token';
      return NextResponse.json({ success: false, message }, { status: 401 });
    }
  }

  const base = getMpeWebAppBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: 'API base URL not set. Set NEXT_PUBLIC_LOCAL_APP_URL (e.g. http://localhost:3000).' },
      { status: 500 }
    );
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: authHeader };

  try {
    const res = await fetch(`${base}/api/auth/me`, { headers });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'MPE_WEB_UNREACHABLE',
        message: `Cannot reach the MPE Web app at ${base}. Is it running? from /api/auth/me.` + msg,
        detail: msg,
      },
      { status: 503 }
    );
  }
}
