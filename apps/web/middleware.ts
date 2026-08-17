import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "internal_search_ai_auth_secret_32_bytes_key";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret,
    secureCookie: req.nextUrl.protocol === 'https:',
  });
  const { pathname } = req.nextUrl;

  const protectedRoutes = ['/dashboard', '/chat', '/search', '/connections'];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/chat/:path*', '/search/:path*', '/connections/:path*', '/login'],
};
