import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

/**
 * API Route: Admin Operations Proxy
 *
 * This route acts as a catch-all proxy for admin-related API endpoints, forwarding
 * requests to the MPE Web app backend. It handles all HTTP methods (GET, POST, PATCH, DELETE).
 *
 * Route pattern: /api/admin/[...path]
 * - Supports dynamic path segments (e.g., /api/admin/users, /api/admin/users/123)
 * - Preserves query parameters and request body
 * - Forwards authorization headers for authenticated requests
 *
 * Purpose:
 * - Provides a unified admin API interface
 * - Avoids CORS issues when backend runs on different port/domain
 * - Centralizes error handling for admin operations
 *
 * Note: Specific admin endpoints like /api/admin/agents, /api/admin/clients, and
 * /api/admin/moderators have dedicated routes that enforce role filtering server-side.
 * This catch-all route handles other admin endpoints.
 *
 * Error responses:
 * - 500: API base URL not configured
 * - 503: MPE Web app is unreachable
 */

/**
 * Builds the target URL for the admin proxy request
 * @param path - Optional array of path segments from the catch-all route
 * @param search - Optional query string (should start with '?')
 * @returns Complete URL string for the backend request, or empty string if base URL not set
 */
function buildProxyUrl(path: string[] | undefined, search?: string): string {
  const base = getMpeWebAppBaseUrl();
  if (!base) return '';
  const segment = path && path.length > 0 ? path.join('/') : '';
  const pathPart = `${base}/api/admin${segment ? `/${segment}` : ''}`;
  return search && search.startsWith('?') ? `${pathPart}${search}` : pathPart;
}

/**
 * Proxy function that forwards requests to the MPE Web app's admin API
 * @param req - The incoming Next.js request
 * @param path - Optional path segments from the catch-all route
 * @returns NextResponse with the proxied response or error
 */
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

  // Preserve query parameters from the original request
  const search = req.nextUrl.search;
  const url = buildProxyUrl(path, search);

  // Set up headers for the proxied request
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  const ifMatch = req.headers.get('If-Match');
  if (ifMatch) headers['If-Match'] = ifMatch;

  // Extract request body for non-GET/HEAD requests
  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.text();
    } catch {
      // Request has no body or body parsing failed
    }
  }

  try {
    // Forward the request to MPE Web app
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: body || undefined,
    });
    const data = await res.json().catch(() => ({}));
    const nextRes = NextResponse.json(data, { status: res.status });
    const etag = res.headers.get('ETag');
    if (etag) nextRes.headers.set('ETag', etag);
    return nextRes;
  } catch (e: unknown) {
    // Handle network errors or unreachable backend
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'MPE_WEB_UNREACHABLE',
        message: `Cannot reach the MPE Web app at ${base}. Is it running? In development, run \`pnpm dev\` in the "MPE Web app" project (port 3000). Ensure NEXT_PUBLIC_LOCAL_APP_URL / NEXT_PUBLIC_APP_URL point to it.`,
        detail: msg,
      },
      { status: 503 }
    );
  }
}

/**
 * GET handler - Fetches admin resources
 * Supports paths like:
 * - /api/admin/users (if not using specific routes)
 * - /api/admin/settings
 * - Other admin endpoints not covered by specific routes
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

/**
 * POST handler - Creates admin resources
 * Supports paths like:
 * - /api/admin/users (if not using specific routes)
 * - Other admin creation endpoints
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

/**
 * PATCH handler - Updates admin resources
 * Supports paths like:
 * - /api/admin/users/{id} (if not using specific routes)
 * - Other admin update endpoints
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path);
}

/**
 * DELETE handler - Deletes admin resources
 * Supports paths like:
 * - /api/admin/users/{id} (if not using specific routes)
 * - Other admin deletion endpoints
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path);
}
