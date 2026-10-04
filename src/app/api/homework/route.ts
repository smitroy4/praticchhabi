import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { listHomework, createHomework, type HomeworkInput } from '@/lib/server/repo';

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return guarded(auth);
  const homework = await listHomework(auth.user);
  return json({ homework });
}

export async function POST(request: Request) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);

  const body = await request.json().catch(() => ({}));
  const input = body as HomeworkInput;
  if (!input.title?.trim()) return apiError(400, 'Title is required');
  if (!input.description?.trim()) return apiError(400, 'Description is required');
  if (!input.dueDate) return apiError(400, 'Due date is required');
  if (!Array.isArray(input.studentIds) || input.studentIds.length === 0) {
    return apiError(400, 'Select at least one student');
  }

  const created = await createHomework(
    {
      title: input.title.trim(),
      description: input.description.trim(),
      assignedDate: input.assignedDate || new Date().toISOString().split('T')[0],
      dueDate: input.dueDate,
      classId: input.classId ?? null,
      studentIds: input.studentIds,
      attachments: input.attachments ?? [],
    },
    auth.user.id
  );
  return json({ homework: created }, { status: 201 });
}
