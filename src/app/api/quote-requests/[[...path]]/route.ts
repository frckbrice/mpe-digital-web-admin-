import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

function buildUrl(path: string[] | undefined, search: string, base: string): string {
  const segment = path && path.length > 0 ? path.join('/') : '';
  return `${base}/api/quote-requests${segment ? `/${segment}` : ''}${search || ''}`;
}

async function proxy(req: NextRequest, path: string[] | undefined): Promise<NextResponse> {
  const base = getMpeWebAppBaseUrl();
  if (!base) {
    return NextResponse.json({ error: 'API base URL not set.' }, { status: 500 });
  }
  const search = req.nextUrl.search;
  const url = buildUrl(path, search, base);
  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    try {
      body = await req.arrayBuffer();
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(url, { method: req.method, headers, body: body && body.byteLength > 0 ? body : undefined });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'MPE_WEB_UNREACHABLE', message: `Cannot reach MPE Web at ${base}.`, detail: msg }, { status: 503 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}
