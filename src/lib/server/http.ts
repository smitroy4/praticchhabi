import { NextResponse } from 'next/server';
import { getCurrentUser, type SessionUser } from './session';
import type { UserRole } from '@/types';

export function json(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function apiError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export type ApiResult =
  | { ok: true; user: SessionUser }
  | { ok: false; status: 401 | 403; message: string };

/** Resolves the caller and enforces role-based access for a route handler. */
export async function requireUser(roles?: UserRole[]): Promise<ApiResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, message: 'Not authenticated' };
  if (roles && !roles.includes(user.role)) {
    return { ok: false, status: 403, message: 'You do not have permission to do that' };
  }
  return { ok: true, user };
}

export function guarded(result: Extract<ApiResult, { ok: false }>): NextResponse {
  return apiError(result.status, result.message);
}
