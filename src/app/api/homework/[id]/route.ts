import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { getHomework, updateHomework, deleteHomework, type HomeworkInput } from '@/lib/server/repo';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const homework = await getHomework(id, auth.user);
  if (!homework) return apiError(404, 'Homework not found');
  return json({ homework });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const existing = await getHomework(id, auth.user);
  if (!existing) return apiError(404, 'Homework not found');
  await updateHomework(id, body as Partial<HomeworkInput>);
  const homework = await getHomework(id, auth.user);
  return json({ homework });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const existing = await getHomework(id, auth.user);
  if (!existing) return apiError(404, 'Homework not found');
  await deleteHomework(id);
  return json({ ok: true });
}
