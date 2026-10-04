import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { listClasses, createClass, type ClassInput } from '@/lib/server/repo';

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return guarded(auth);
  const url = new URL(request.url);
  const classes = await listClasses(auth.user, {
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });
  return json({ classes });
}

export async function POST(request: Request) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);

  const body = await request.json().catch(() => ({}));
  const input = body as ClassInput;

  if (!input.title?.trim()) return apiError(400, 'Title is required');
  if (!input.date || !input.startTime || !input.endTime) return apiError(400, 'Date and times are required');
  if (input.type === 'online' && !input.meetingUrl) {
    return apiError(400, 'A Google Meet link is required for online classes');
  }
  if (!Array.isArray(input.studentIds) || input.studentIds.length === 0) {
    return apiError(400, 'Select at least one student');
  }

  const created = await createClass(
    {
      ...input,
      title: input.title.trim(),
      description: input.description?.trim(),
      studentIds: input.studentIds,
      recurrence: input.recurrence ?? 'none',
    },
    auth.user.id
  );
  return json({ class: created }, { status: 201 });
}
