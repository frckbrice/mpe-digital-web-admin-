import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

/**
 * API Route: /api/auth/google
 * 
 * Proxies POST requests to the MPE Web app's Google OAuth authentication endpoint.
 * This proxy pattern avoids CORS issues when the MPE Web app runs on a different port
 * or domain than the admin app.
 * 
 * Purpose:
 * - Handles Google OAuth authentication flow
 * - Forwards authentication requests to the MPE Web app
 * - Returns authentication tokens and user data
 * 
 * Architecture:
 * - The admin app acts as a proxy layer between the frontend and the MPE Web backend
 * - Google OAuth is handled entirely by the MPE Web app
 * - This route simply forwards the request to avoid CORS issues
 * 
 * Request Body:
 * - Typically contains Google ID token or OAuth code
 * 
 * Response:
 * - On success: Returns user data and authentication tokens
 * - On error: Returns error details from MPE Web app
 * 
 * Error Handling:
 * - Returns 500 if API base URL is not configured
 * - Returns 503 if MPE Web app is unreachable
 * - Returns error status from MPE Web app if authentication fails
 */
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
