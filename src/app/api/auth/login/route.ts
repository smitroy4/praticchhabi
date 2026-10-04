import { queryOne } from '@/lib/server/db';
import { verifyPassword } from '@/lib/server/password';
import { createSession, toSessionUser, type SessionUser } from '@/lib/server/session';
import { json, apiError } from '@/lib/server/http';

interface UserRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  avatar: string | null;
  student_id: string | null;
  teacher_id: string | null;
  class_ids: string[];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) return apiError(400, 'Email and password are required');

  const row = await queryOne<UserRow>('select * from users where lower(email) = $1', [email]);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return apiError(401, 'Invalid email or password');
  }

  await createSession(row.id);
  const user: SessionUser = toSessionUser(row);
  return json({ user });
}
