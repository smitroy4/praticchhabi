import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import {
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementInput,
} from '@/lib/server/repo';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const announcement = await getAnnouncement(id, auth.user);
  if (!announcement) return apiError(404, 'Announcement not found');
  return json({ announcement });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const existing = await getAnnouncement(id, auth.user);
  if (!existing) return apiError(404, 'Announcement not found');

  const body = await request.json().catch(() => ({}));
  await updateAnnouncement(id, body as Partial<AnnouncementInput>, auth.user);
  const announcement = await getAnnouncement(id, auth.user);
  return json({ announcement });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const existing = await getAnnouncement(id, auth.user);
  if (!existing) return apiError(404, 'Announcement not found');
  await deleteAnnouncement(id, auth.user);
  return json({ ok: true });
}
