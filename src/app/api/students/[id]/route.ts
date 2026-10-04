import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { getStudent } from '@/lib/server/repo';
import { query, queryOne } from '@/lib/server/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireUser(['admin', 'teacher', 'student']);
  if (!auth.ok) return guarded(auth);
  const { id } = await ctx.params;

  if (auth.user.role === 'student' && auth.user.id !== id) {
    return apiError(403, 'You can only view your own profile');
  }

  const student = await getStudent(id);
  if (!student) return apiError(404, 'Student not found');

  const counts = await queryOne<{
    class_count: number;
    homework_count: number;
    pending_count: number;
    submitted_count: number;
  }>(
    `select
       (select count(*)::int from class_sessions c where $1 = any(c.student_ids)) as class_count,
       (select count(*)::int from homework h where $1 = any(h.student_ids)) as homework_count,
       (select count(*)::int from homework h
         where $1 = any(h.student_ids)
           and h.due_date >= current_date
           and not exists (select 1 from homework_submissions s
                            where s.homework_id = h.id and s.student_id = $1 and s.status <> 'pending')
       ) as pending_count,
       (select count(*)::int from homework_submissions s
         where s.student_id = $1 and s.status = 'submitted') as submitted_count`,
    [id]
  );

  const activity = await query<{
    id: string;
    homework_title: string;
    status: string;
    submitted_at: Date | null;
    reviewed_at: Date | null;
  }>(
    `select s.id, h.title as homework_title, s.status, s.submitted_at, s.reviewed_at
       from homework_submissions s
       join homework h on h.id = s.homework_id
      where s.student_id = $1 and s.status <> 'pending'
      order by coalesce(s.reviewed_at, s.submitted_at) desc
      limit 6`,
    [id]
  );

  return json({
    student,
    classCount: counts?.class_count ?? 0,
    homeworkCount: counts?.homework_count ?? 0,
    pendingCount: counts?.pending_count ?? 0,
    submittedCount: counts?.submitted_count ?? 0,
    activity: activity.map((a) => ({
      id: a.id,
      title: a.homework_title,
      status: a.status,
      submittedAt: a.submitted_at,
      reviewedAt: a.reviewed_at,
    })),
  });
}
