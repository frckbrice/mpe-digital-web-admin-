import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/.well-known')) {
    return NextResponse.next();
  }
  if (/\.(png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|json|xml|txt)$/i.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/((?!_next/static|_next/image|_next/webpack-hmr|api|favicon.ico|.*\\..*).*)'],
};
