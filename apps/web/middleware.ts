import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Check if user has required role for admin routes
    if (req.nextUrl.pathname.startsWith('/admin') && req.nextauth.token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Check if user has required role for analyst routes
    if (
      req.nextUrl.pathname.startsWith('/analytics') &&
      !['ADMIN', 'ANALYST'].includes(req.nextauth.token?.role as string)
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/research/:path*',
    '/projects/:path*',
    '/briefs/:path*',
    '/analytics/:path*',
    '/admin/:path*',
    '/api/auth/:path*',
  ],
};