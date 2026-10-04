import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { submitHomework } from '@/lib/server/repo';
import type { Attachment } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireUser(['student']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;

  const body = await request.json().catch(() => ({}));
  const files = Array.isArray(body.files) ? (body.files as Attachment[]) : [];
  if (files.length === 0) return apiError(400, 'Add at least one file to your submission');

  try {
    const submission = await submitHomework(id, auth.user, files, body.note);
    return json({ submission }, { status: 201 });
  } catch (err) {
    return apiError(400, err instanceof Error ? err.message : 'Submission failed');
  }
}
