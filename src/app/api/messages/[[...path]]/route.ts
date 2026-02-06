import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

/**
 * API Route: Messages Proxy
 *
 * This route acts as a proxy for all message-related API endpoints, forwarding requests
 * to the MPE Web app backend. It handles GET, POST, PATCH, and DELETE operations.
 *
 * Route pattern: /api/messages/[...path]
 * - Supports dynamic path segments (e.g., /api/messages/123, /api/messages/123/replies)
 * - Preserves query parameters and request body
 * - Forwards authorization headers for authenticated requests
 *
 * Purpose:
 * - Avoids CORS issues when MPE Web app runs on a different port/domain
 * - Provides a unified API interface for the admin app
 * - Handles errors gracefully when backend is unreachable
 *
 * Error responses:
 * - 500: API base URL not configured (check NEXT_PUBLIC_LOCAL_APP_URL or NEXT_PUBLIC_APP_URL)
 * - 503: MPE Web app is unreachable (check if backend is running)
 */

/**
 * Builds the target URL for the proxy request
 * @param path - Optional array of path segments from the catch-all route
 * @param search - Query string from the original request
 * @param base - Base URL of the MPE Web app
 * @returns Complete URL string for the backend request
 */
function buildUrl(path: string[] | undefined, search: string, base: string): string {
  const segment = path && path.length > 0 ? path.join('/') : '';
  return `${base}/api/messages${segment ? `/${segment}` : ''}${search || ''}`;
}

/**
 * Proxy function that forwards requests to the MPE Web app backend
 * @param req - Next.js request object
 * @param path - Optional path segments from the catch-all route
 * @returns NextResponse with the backend response or error
 */
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
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'MPE_WEB_UNREACHABLE',
        message: `Cannot reach MPE Web at ${base}.`,
        detail: msg,
      },
      { status: 503 }
    );
  }
}

/**
 * GET /api/messages/[...path]
 * Retrieves messages or message-related data from the backend
 * Example: GET /api/messages/123 -> GET {base}/api/messages/123
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}

/**
 * POST /api/messages/[...path]
 * Creates new messages or performs message-related actions
 * Example: POST /api/messages -> POST {base}/api/messages
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}

/**
 * PATCH /api/messages/[...path]
 * Updates existing messages or message properties
 * Example: PATCH /api/messages/123 -> PATCH {base}/api/messages/123
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(req, (await params).path);
}

/**
 * DELETE /api/messages/[...path]
 * Deletes messages or message-related resources
 * Example: DELETE /api/messages/123 -> DELETE {base}/api/messages/123
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxy(req, (await params).path);
}
