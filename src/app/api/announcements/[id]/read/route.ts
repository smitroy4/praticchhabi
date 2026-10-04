import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { markAnnouncementRead, unreadAnnouncementCount } from '@/lib/server/repo';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  if (!id) return apiError(400, 'Announcement id is required');
  await markAnnouncementRead(id, auth.user.id);
  const unreadCount = await unreadAnnouncementCount(auth.user.id, auth.user.role);
  return json({ ok: true, unreadCount });
}
