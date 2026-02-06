import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/moderators
 * List only moderators (role=MODERATOR). Always enforces role=MODERATOR server-side.
 * Forwards: search, isActive, page, pageSize to the backend.
 * All filtering and pagination happen in the MPE Web app (backend).
 */
export async function GET(req: NextRequest) {
  const base = getMpeWebAppBaseUrl();
  if (!base) {
    return NextResponse.json(
      {
        error: 'API base URL not set. Set NEXT_PUBLIC_LOCAL_APP_URL (e.g. http://localhost:3000).',
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams(req.nextUrl.searchParams);
  params.set('role', 'MODERATOR');
  const url = `${base}/api/admin/users?${params.toString()}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  try {
    const res = await fetch(url, { method: 'GET', headers });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'MPE_WEB_UNREACHABLE',
        message: `Cannot reach the MPE Web app at ${base}. Is it running?`,
        detail: msg,
      },
      { status: 503 }
    );
  }
}
