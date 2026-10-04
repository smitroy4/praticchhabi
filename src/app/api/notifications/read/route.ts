import { requireUser, guarded, json } from '@/lib/server/http';
import { markNotificationsRead, unreadNotificationCount } from '@/lib/server/repo';

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return guarded(auth);
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : undefined;
  await markNotificationsRead(auth.user.id, ids);
  const unreadCount = await unreadNotificationCount(auth.user.id);
  return json({ ok: true, unreadCount });
}
