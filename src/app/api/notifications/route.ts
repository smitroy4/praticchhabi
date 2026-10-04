import { requireUser, guarded, json } from '@/lib/server/http';
import { listNotifications, unreadNotificationCount } from '@/lib/server/repo';
import { ensureAutomaticReminders } from '@/lib/server/notify';

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return guarded(auth);
  await ensureAutomaticReminders(auth.user.id);
  const notifications = await listNotifications(auth.user);
  const unreadCount = await unreadNotificationCount(auth.user.id);
  return json({ notifications, unreadCount });
}
