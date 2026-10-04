import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { getHomework, listSubmissions } from '@/lib/server/repo';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;
  const homework = await getHomework(id, auth.user);
  if (!homework) return apiError(404, 'Homework not found');
  const submissions = await listSubmissions(id);

  const byStudent = new Map(submissions.map((s) => [s.studentId, s]));
  const roster = homework.studentIds.map((studentId) => {
    const existing = byStudent.get(studentId);
    return (
      existing ?? {
        id: '',
        homeworkId: id,
        studentId,
        status: 'pending' as const,
        files: [],
        note: null,
        submittedAt: null,
        feedback: null,
        reviewedAt: null,
        reviewedBy: null,
      }
    );
  });

  return json({ submissions: roster });
}
