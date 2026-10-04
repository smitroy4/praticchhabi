import { getCurrentUser } from '@/lib/server/session';
import { json } from '@/lib/server/http';
import { unreadAnnouncementCount } from '@/lib/server/repo';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ user: null });
  const unreadAnnouncements = await unreadAnnouncementCount(user.id, user.role);
  return json({ user, unreadAnnouncements });
}
