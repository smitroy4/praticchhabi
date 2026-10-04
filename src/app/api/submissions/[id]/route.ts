import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { reviewSubmission } from '@/lib/server/repo';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;

  const body = await request.json().catch(() => ({}));
  const feedback = String(body.feedback ?? '').trim();
  if (!feedback) return apiError(400, 'Feedback is required to review a submission');

  try {
    const submission = await reviewSubmission(id, auth.user, feedback);
    return json({ submission });
  } catch (err) {
    return apiError(404, err instanceof Error ? err.message : 'Review failed');
  }
}
