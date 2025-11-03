import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/login') || pathname.startsWith('/p/') || pathname.startsWith('/api/public-education')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    const hasAnyCookie = req.headers.get('cookie')?.includes('sb-') ?? false;
    if (!hasAnyCookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/p/:path*', '/api/public-education'],
};
