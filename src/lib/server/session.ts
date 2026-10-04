import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { query, queryOne } from './db';
import type { DemoUser, UserRole } from '@/types';

export const SESSION_COOKIE = 'praticchhabi_session';
export const ROLE_COOKIE = 'praticchhabi_role';
const SESSION_DAYS = 7;

export interface SessionUser extends DemoUser {
  classIds: string[];
}

interface UserRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  student_id: string | null;
  teacher_id: string | null;
  class_ids: string[];
}

export function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    avatar: row.avatar ?? undefined,
    studentId: row.student_id ?? undefined,
    teacherId: row.teacher_id ?? undefined,
    classIds: row.class_ids ?? [],
  };
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await query(
    'insert into sessions (token, user_id, expires_at) values ($1, $2, $3)',
    [token, userId, expires]
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
  const user = await getUserById(userId);
  store.set(ROLE_COOKIE, user?.role ?? 'student', {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await query('delete from sessions where token = $1', [token]);
  store.delete(SESSION_COOKIE);
  store.delete(ROLE_COOKIE);
}

export async function getUserById(userId: string): Promise<SessionUser | null> {
  const row = await queryOne<UserRow>('select * from users where id = $1', [userId]);
  return row ? toSessionUser(row) : null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await queryOne<UserRow>(
    `select u.* from sessions s
       join users u on u.id = s.user_id
      where s.token = $1 and s.expires_at > now()`,
    [token]
  );
  return row ? toSessionUser(row) : null;
}
