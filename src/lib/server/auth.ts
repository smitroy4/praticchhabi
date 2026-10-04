import { redirect } from 'next/navigation';
import { getCurrentUser, type SessionUser } from './session';
import type { UserRole } from '@/types';

export function homeFor(role: UserRole): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'teacher') return '/teacher/dashboard';
  return '/student/home';
}

/** Server-component guard: redirects to login or the caller's own area. */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
