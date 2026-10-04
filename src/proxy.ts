import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'praticchhabi_session';
const ROLE_COOKIE = 'praticchhabi_role';

function homeFor(role: string): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'teacher') return '/teacher/dashboard';
  return '/student/home';
}

/**
 * Coarse route protection: requires a session cookie for the app areas and
 * keeps users inside their own role's area. Authoritative role checks happen
 * in the area layouts and in every API handler (database-backed).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value ?? 'student';

  const area = pathname.split('/')[1];
  const isProtected = area === 'admin' || area === 'teacher' || area === 'student';

  if (pathname === '/') {
    return NextResponse.redirect(new URL(session ? homeFor(role) : '/login', request.url));
  }

  if (isProtected) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (area !== role) {
      return NextResponse.redirect(new URL(homeFor(role), request.url));
    }
  }

  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/login', '/'],
};
