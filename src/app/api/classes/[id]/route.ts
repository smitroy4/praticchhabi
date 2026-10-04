import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { getClass, updateClass, deleteClass, type ClassInput } from '@/lib/server/repo';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const cls = await getClass(id, auth.user);
  if (!cls) return apiError(404, 'Class not found');
  return json({ class: cls });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const updated = await updateClass(id, body as Partial<ClassInput>);
  if (!updated) return apiError(400, 'Nothing to update');
  const cls = await getClass(id, auth.user);
  return json({ class: cls });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const existing = await getClass(id, auth.user);
  if (!existing) return apiError(404, 'Class not found');
  await deleteClass(id);
  return json({ ok: true });
}
