import { NextRequest, NextResponse } from 'next/server';
import { getMpeWebAppBaseUrl } from '@/lib/mpe-web-url';

export const dynamic = 'force-dynamic';

/**
 * API Route: /api/notifications/[[...path]]
 * 
 * This is a catch-all proxy route that forwards all HTTP methods (GET, POST, PATCH, DELETE)
 * to the MPE Web app's notifications API endpoints. This proxy pattern avoids CORS issues and
 * provides a unified API interface for notification operations.
 * 
 * Purpose:
 * - Proxies requests to /api/notifications/* endpoints in the MPE Web app
 * - Handles notification-related operations (fetching, marking as read, deleting notifications)
 * - Preserves authentication headers and request bodies
 * 
 * Architecture:
 * - The admin app acts as a proxy layer between the frontend and the MPE Web backend
 * - All notification operations are handled by the MPE Web app, ensuring single source of truth
 * 
 * Error Handling:
 * - Returns 500 if API base URL is not configured
 * - Returns 503 if MPE Web app is unreachable
 */

/**
 * Builds the target URL for the proxy request
 * @param path - Optional path segments from the catch-all route
 * @param search - Query string from the original request
 * @param base - Base URL of the MPE Web app
 * @returns Complete URL to forward the request to
 */
function buildUrl(path: string[] | undefined, search: string, base: string): string {
  const segment = path && path.length > 0 ? path.join('/') : '';
  return `${base}/api/notifications${segment ? `/${segment}` : ''}${search || ''}`;
}

/**
 * Proxy function that forwards requests to the MPE Web app
 * @param req - The incoming Next.js request
 * @param path - Optional path segments from the catch-all route
 * @returns NextResponse with the proxied response or error
 */
async function proxy(req: NextRequest, path: string[] | undefined): Promise<NextResponse> {
  const base = getMpeWebAppBaseUrl();
  if (!base) {
    return NextResponse.json({ error: 'API base URL not set.' }, { status: 500 });
  }
  
  // Preserve query parameters from the original request
  const search = req.nextUrl.search;
  const url = buildUrl(path, search, base);
  
  // Forward authorization and content-type headers
  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  // Extract request body for non-GET/HEAD requests
  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    try {
      body = await req.arrayBuffer();
    } catch {
      // Request has no body or body parsing failed
    }
  }

  try {
    // Forward the request to MPE Web app
    const res = await fetch(url, { 
      method: req.method, 
      headers, 
      body: body && body.byteLength > 0 ? body : undefined 
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    // Handle network errors or unreachable backend
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: 'MPE_WEB_UNREACHABLE', 
      message: `Cannot reach MPE Web at ${base}.`, 
      detail: msg 
    }, { status: 503 });
  }
}

/**
 * GET handler - Fetches notifications
 * Supports paths like:
 * - /api/notifications (list notifications)
 * - /api/notifications/{id} (get specific notification)
 * - /api/notifications/unread (get unread count)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}

/**
 * POST handler - Creates notifications (typically admin/system only)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}

/**
 * PATCH handler - Updates notification status
 * Supports paths like:
 * - /api/notifications/{id}/read (mark as read)
 * - /api/notifications/read-all (mark all as read)
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}

/**
 * DELETE handler - Deletes notifications
 * Supports paths like:
 * - /api/notifications/{id} (delete notification)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, (await params).path);
}
