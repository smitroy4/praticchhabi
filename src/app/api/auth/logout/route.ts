import { destroySession } from '@/lib/server/session';
import { json } from '@/lib/server/http';

export async function POST() {
  await destroySession();
  return json({ ok: true });
}
