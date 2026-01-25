import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

/** Proxies PATCH /api/auth/profile to the MPE Web app. Avoids CORS and "Failed to fetch" when MPE Web runs on another port. */
export async function PATCH(req: NextRequest) {
  const base = getMpeWebAppBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: 'API base URL not set. Set NEXT_PUBLIC_LOCAL_APP_URL (e.g. http://localhost:3000).' },
      { status: 500 }
    );
  }
  const auth = req.headers.get('authorization');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = auth;

  let body: string | undefined;
  try {
    body = await req.text();
  } catch {
    // no body
  }

  try {
    const res = await fetch(`${base}/api/auth/profile`, {
      method: 'PATCH',
      headers,
      body: body || undefined,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'MPE_WEB_UNREACHABLE',
        message: `Cannot reach the MPE Web app at ${base}. Is it running? In development, start the MPE Web app (e.g. pnpm dev on port 3000). Ensure NEXT_PUBLIC_LOCAL_APP_URL points to it.`,
        detail: msg,
      },
      { status: 503 }
    );
  }
}
