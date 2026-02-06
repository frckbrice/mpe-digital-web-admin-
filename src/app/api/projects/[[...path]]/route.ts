import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

function buildProxyUrl(path: string[] | undefined, search?: string): string {
  const base = getMpeWebAppBaseUrl();
  if (!base) return '';
  const segment = path && path.length > 0 ? path.join('/') : '';
  const pathPart = `${base}/api/projects${segment ? `/${segment}` : ''}`;
  return search && search.startsWith('?') ? `${pathPart}${search}` : pathPart;
}

async function proxy(req: NextRequest, path: string[] | undefined): Promise<NextResponse> {
  const base = getMpeWebAppBaseUrl();
  if (!base) {
    return NextResponse.json(
      {
        error: 'API base URL not set. Set NEXT_PUBLIC_LOCAL_APP_URL (e.g. http://localhost:3000).',
      },
      { status: 500 }
    );
  }

  const search = req.nextUrl.search;
  const url = buildProxyUrl(path, search);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.text();
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(url, { method: req.method, headers, body: body || undefined });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'MPE_WEB_UNREACHABLE',
        message: `Cannot reach the MPE Web app at ${base}. Is it running? Ensure NEXT_PUBLIC_LOCAL_APP_URL / NEXT_PUBLIC_APP_URL point to it.`,
        detail: msg,
      },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path);
}
