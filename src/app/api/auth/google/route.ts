import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

/** Proxies POST /api/auth/google to the MPE Web app. */
export async function POST(req: NextRequest) {
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
    body = undefined;
  }

  try {
    const res = await fetch(`${base}/api/auth/google`, {
      method: 'POST',
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
        message: `Cannot reach the MPE Web app at ${base}. Is it running? In development, start it (e.g. pnpm dev on port 3000).`,
        detail: msg,
      },
      { status: 503 }
    );
  }
}
