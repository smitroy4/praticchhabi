import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import {
  listAnnouncements,
  createAnnouncement,
  unreadAnnouncementCount,
  type AnnouncementInput,
} from '@/lib/server/repo';

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return guarded(auth);
  const announcements = await listAnnouncements(auth.user);
  const unreadCount = await unreadAnnouncementCount(auth.user.id, auth.user.role);
  return json({ announcements, unreadCount });
}

export async function POST(request: Request) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);

  const body = await request.json().catch(() => ({}));
  const input = body as AnnouncementInput;
  if (!input.title?.trim()) return apiError(400, 'Title is required');
  if (!input.description?.trim()) return apiError(400, 'Description is required');

  const announcement = await createAnnouncement(
    {
      title: input.title.trim(),
      description: input.description.trim(),
      audience: input.audience ?? 'all',
      attachments: input.attachments ?? [],
      publishAt: input.publishAt,
    },
    auth.user
  );
  return json({ announcement }, { status: 201 });
}
