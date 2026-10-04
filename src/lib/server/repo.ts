import { randomUUID } from 'node:crypto';
import { query, queryOne } from './db';
import { notify, notifyMany, audienceToUserIds } from './notify';
import type {
  Announcement,
  AnnouncementAttachment,
  AppSettings,
  Attachment,
  ClassSession,
  Homework,
  HomeworkAttachment,
  HomeworkSubmission,
  HomeworkStatus,
  Notification,
  Recurrence,
} from '@/types';
import type { SessionUser } from './session';

/* ------------------------------------------------------------------ rows */

interface ClassRow extends Record<string, unknown> {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  teacher_id: string;
  type: string;
  meeting_url: string | null;
  location: string | null;
  student_ids: string[];
  recurrence: string;
  series_id: string | null;
  teacher_name?: string | null;
}

interface HomeworkRow extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  teacher_id: string;
  class_id: string | null;
  student_ids: string[];
  attachments: HomeworkAttachment[];
  teacher_name?: string | null;
}

interface SubmissionRow extends Record<string, unknown> {
  id: string;
  homework_id: string;
  student_id: string;
  status: string;
  files: Attachment[];
  note: string | null;
  submitted_at: Date | string | null;
  feedback: string | null;
  reviewed_at: Date | string | null;
  reviewed_by: string | null;
  student_name?: string | null;
}

interface AnnouncementRow extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  author_id: string;
  author_name: string;
  author_role: string;
  audience: unknown;
  attachments: AnnouncementAttachment[];
  created_at: Date | string;
  updated_at: Date | string | null;
  read_at?: Date | string | null;
}

interface NotificationRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  related_id: string | null;
  created_at: Date | string;
}

const iso = (v: Date | string | null | undefined): string =>
  v ? (v instanceof Date ? v.toISOString() : new Date(v).toISOString()) : '';
const optionalIso = (v: Date | string | null | undefined): string | null =>
  v ? (v instanceof Date ? v.toISOString() : new Date(v).toISOString()) : null;
const today = (): string => new Date().toISOString().split('T')[0];

/* -------------------------------------------------------------- mapping */

function mapClass(row: ClassRow): ClassSession {
  return {
    id: row.id,
    title: row.title,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : String(row.date),
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name ?? undefined,
    type: row.type as ClassSession['type'],
    meetingUrl: row.meeting_url ?? undefined,
    location: row.location ?? undefined,
    studentIds: row.student_ids ?? [],
    description: row.description ?? undefined,
    recurrence: row.recurrence as Recurrence,
    seriesId: row.series_id,
  };
}

function mapSubmission(row: SubmissionRow): HomeworkSubmission {
  return {
    id: row.id,
    homeworkId: row.homework_id,
    studentId: row.student_id,
    studentName: row.student_name ?? undefined,
    status: row.status as HomeworkSubmission['status'],
    files: row.files ?? [],
    note: row.note,
    submittedAt: optionalIso(row.submitted_at),
    feedback: row.feedback,
    reviewedAt: optionalIso(row.reviewed_at),
    reviewedBy: row.reviewed_by,
  };
}

function deriveStatus(
  dueDate: string,
  submission?: HomeworkSubmission | null
): HomeworkStatus {
  if (submission?.status === 'reviewed') return 'reviewed';
  if (submission?.status === 'submitted') return 'submitted';
  if (dueDate < today()) return 'overdue';
  return 'pending';
}

function mapHomework(
  row: HomeworkRow,
  submission?: HomeworkSubmission | null,
  counts?: Homework['submissionCounts']
): Homework {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignedDate: typeof row.assigned_date === 'string' ? row.assigned_date.slice(0, 10) : String(row.assigned_date),
    dueDate: typeof row.due_date === 'string' ? row.due_date.slice(0, 10) : String(row.due_date),
    teacherId: row.teacher_id,
    teacherName: row.teacher_name ?? undefined,
    studentIds: row.student_ids ?? [],
    classId: row.class_id,
    attachments: row.attachments ?? [],
    status: deriveStatus(
      typeof row.due_date === 'string' ? row.due_date.slice(0, 10) : String(row.due_date),
      submission
    ),
    submission: submission ?? undefined,
    submissionCounts: counts,
  };
}

function mapAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    authorId: row.author_id,
    authorName: row.author_name,
    authorRole: row.author_role as Announcement['authorRole'],
    createdAt: iso(row.created_at),
    updatedAt: optionalIso(row.updated_at),
    attachments: row.attachments ?? [],
    audience: (row.audience ?? 'all') as Announcement['audience'],
    read: row.read_at != null,
  };
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type as Notification['type'],
    read: row.read,
    relatedId: row.related_id,
    createdAt: iso(row.created_at),
  };
}

/* ------------------------------------------------------------- classes */

export async function listClasses(
  user: SessionUser,
  opts: { from?: string; to?: string } = {}
): Promise<ClassSession[]> {
  const params: unknown[] = [];
  let where = '';

  if (user.role === 'student') {
    params.push(user.id);
    where = `where (c.student_ids @> array[$${params.length}] or c.teacher_id = $${params.length})`;
  } else if (user.role === 'teacher') {
    params.push(user.id);
    where = `where c.teacher_id = $${params.length}`;
  }

  if (opts.from) {
    params.push(opts.from);
    where += `${where ? ' and' : ' where'} c.date >= $${params.length}`;
  }
  if (opts.to) {
    params.push(opts.to);
    where += `${where ? ' and' : ' where'} c.date <= $${params.length}`;
  }

  const rows = await query<ClassRow>(
    `select c.*, u.name as teacher_name
       from class_sessions c
       join users u on u.id = c.teacher_id
       ${where}
      order by c.date asc, c.start_time asc`,
    params
  );
  return rows.map(mapClass);
}

export async function getClass(id: string, user: SessionUser): Promise<ClassSession | null> {
  const row = await queryOne<ClassRow>(
    `select c.*, u.name as teacher_name from class_sessions c
       join users u on u.id = c.teacher_id where c.id = $1`,
    [id]
  );
  if (!row) return null;
  const cls = mapClass(row);
  if (user.role === 'student' && !cls.studentIds.includes(user.id) && cls.teacherId !== user.id) return null;
  return cls;
}

export interface ClassInput {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  type: 'offline' | 'online';
  meetingUrl?: string;
  location?: string;
  studentIds: string[];
  recurrence?: Recurrence;
  recurrenceUntil?: string;
}

function durationFrom(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? mins : 90;
}

export async function createClass(input: ClassInput, teacherId: string): Promise<ClassSession> {
  const seriesId = input.recurrence && input.recurrence !== 'none' ? randomUUID() : null;
  const duration = input.durationMinutes ?? durationFrom(input.startTime, input.endTime);
  const baseId = randomUUID();

  await query(
    `insert into class_sessions
       (id, title, description, date, start_time, end_time, duration_minutes, teacher_id, type,
        meeting_url, location, student_ids, recurrence, recurrence_until, series_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      baseId, input.title, input.description ?? null, input.date, input.startTime, input.endTime,
      duration, teacherId, input.type, input.meetingUrl ?? null, input.location ?? null,
      input.studentIds, input.recurrence ?? 'none', input.recurrenceUntil ?? null, seriesId,
    ]
  );

  if (seriesId) await expandSeries(baseId, input, teacherId, duration, seriesId);

  await notifyMany(input.studentIds, {
    title: 'Class scheduled',
    message: `${input.title} is scheduled for ${input.date} at ${input.startTime}.`,
    type: 'class_reminder',
    relatedId: baseId,
  });

  return mapClass({
    ...toClassRow(input, baseId, teacherId, duration, seriesId),
  } as unknown as ClassRow);
}

function toClassRow(
  input: ClassInput, id: string, teacherId: string, duration: number, seriesId: string | null
): Record<string, unknown> {
  return {
    id,
    title: input.title,
    description: input.description ?? null,
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    duration_minutes: duration,
    teacher_id: teacherId,
    type: input.type,
    meeting_url: input.meetingUrl ?? null,
    location: input.location ?? null,
    student_ids: input.studentIds,
    recurrence: input.recurrence ?? 'none',
    series_id: seriesId,
  };
}

async function expandSeries(
  baseId: string,
  input: ClassInput,
  teacherId: string,
  duration: number,
  seriesId: string
): Promise<void> {
  const stepDays: Record<string, number> = { daily: 1, weekly: 7, biweekly: 14, monthly: 28 };
  const step = stepDays[input.recurrence ?? 'weekly'] ?? 7;
  const until = input.recurrenceUntil ? new Date(`${input.recurrenceUntil}T00:00:00`) : null;
  let cursor = new Date(`${input.date}T00:00:00`);
  let n = 1;
  const max = until ? 26 : 8;

  while (n <= max) {
    cursor = new Date(cursor.getTime() + step * 86400000);
    if (until && cursor > until) break;
    const date = cursor.toISOString().split('T')[0];
    const id = randomUUID();
    await query(
      `insert into class_sessions
         (id, title, description, date, start_time, end_time, duration_minutes, teacher_id, type,
          meeting_url, location, student_ids, recurrence, recurrence_until, series_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        id, input.title, input.description ?? null, date, input.startTime, input.endTime,
        duration, teacherId, input.type, input.meetingUrl ?? null, input.location ?? null,
        input.studentIds, input.recurrence, input.recurrenceUntil ?? null, seriesId,
      ]
    );
    n++;
  }
}

export async function updateClass(id: string, patch: Partial<ClassInput>): Promise<boolean> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const set = (col: string, value: unknown) => {
    params.push(value);
    sets.push(`${col} = $${params.length}`);
  };
  if (patch.title !== undefined) set('title', patch.title);
  if (patch.description !== undefined) set('description', patch.description);
  if (patch.date !== undefined) set('date', patch.date);
  if (patch.startTime !== undefined) set('start_time', patch.startTime);
  if (patch.endTime !== undefined) set('end_time', patch.endTime);
  if (patch.type !== undefined) set('type', patch.type);
  if (patch.meetingUrl !== undefined) set('meeting_url', patch.meetingUrl);
  if (patch.location !== undefined) set('location', patch.location);
  if (patch.studentIds !== undefined) set('student_ids', patch.studentIds);
  if (sets.length === 0) return false;
  params.push(id);
  const res = await query(`update class_sessions set ${sets.join(', ')} where id = $${params.length}`, params);
  return res.length >= 0;
}

export async function deleteClass(id: string): Promise<void> {
  await query('delete from class_sessions where id = $1', [id]);
  await query("delete from notifications where related_id = $1 and type = 'class_reminder'", [id]);
}

/* ----------------------------------------------------------- homework */

export async function listHomework(user: SessionUser): Promise<Homework[]> {
  if (user.role === 'student') {
    const rows = await query<HomeworkRow>(
      `select h.*, u.name as teacher_name
         from homework h join users u on u.id = h.teacher_id
        where $1 = any(h.student_ids)
        order by h.due_date asc`,
      [user.id]
    );
    const subs = await query<SubmissionRow>(
      'select * from homework_submissions where student_id = $1',
      [user.id]
    );
    const byHw = new Map(subs.map((s) => [s.homework_id, mapSubmission(s)]));
    return rows.map((r) => mapHomework(r, byHw.get(r.id) ?? null));
  }

  const rows = await query<HomeworkRow>(
    `select h.*, u.name as teacher_name
       from homework h join users u on u.id = h.teacher_id
      order by h.due_date asc`
  );
  const counts = await submissionCounts();
  return rows.map((r) => mapHomework(r, null, counts.get(r.id)));
}

async function submissionCounts(): Promise<Map<string, Homework['submissionCounts']>> {
  const rows = await query<{
    homework_id: string;
    total: number;
    pending: number;
    submitted: number;
    reviewed: number;
  }>(
    `select h.id as homework_id,
            coalesce(count(s.id) filter (where s.id is not null), 0)::int as total,
            coalesce(count(s.id) filter (where s.status = 'pending'), 0)::int as pending,
            coalesce(count(s.id) filter (where s.status = 'submitted'), 0)::int as submitted,
            coalesce(count(s.id) filter (where s.status = 'reviewed'), 0)::int as reviewed
       from homework h
       left join homework_submissions s on s.homework_id = h.id
      group by h.id`
  );
  return new Map(
    rows.map((r) => [
      r.homework_id,
      { total: r.total, pending: r.pending, submitted: r.submitted, reviewed: r.reviewed },
    ])
  );
}

export async function getHomework(id: string, user: SessionUser): Promise<Homework | null> {
  const row = await queryOne<HomeworkRow>(
    `select h.*, u.name as teacher_name
       from homework h join users u on u.id = h.teacher_id
      where h.id = $1`,
    [id]
  );
  if (!row) return null;

  if (user.role === 'student') {
    if (!row.student_ids.includes(user.id)) return null;
    const sub = await queryOne<SubmissionRow>(
      'select * from homework_submissions where homework_id = $1 and student_id = $2',
      [id, user.id]
    );
    return mapHomework(row, sub ? mapSubmission(sub) : null);
  }

  const counts = await submissionCounts();
  return mapHomework(row, null, counts.get(id));
}

export async function listSubmissions(homeworkId: string): Promise<HomeworkSubmission[]> {
  const rows = await query<SubmissionRow>(
    `select s.*, u.name as student_name
       from homework_submissions s
       join users u on u.id = s.student_id
      where s.homework_id = $1
      order by s.submitted_at desc nulls last`,
    [homeworkId]
  );
  return rows.map(mapSubmission);
}

export interface HomeworkInput {
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  classId?: string | null;
  studentIds: string[];
  attachments: HomeworkAttachment[];
}

export async function createHomework(input: HomeworkInput, teacherId: string): Promise<Homework> {
  const id = randomUUID();
  await query(
    `insert into homework (id, title, description, assigned_date, due_date, teacher_id, class_id, student_ids, attachments)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id, input.title, input.description, input.assignedDate, input.dueDate,
      teacherId, input.classId ?? null, input.studentIds, JSON.stringify(input.attachments),
    ]
  );

  // make sure every assigned student has a pending submission row
  for (const studentId of input.studentIds) {
    await query(
      `insert into homework_submissions (id, homework_id, student_id) values ($1,$2,$3)
       on conflict (homework_id, student_id) do nothing`,
      [randomUUID(), id, studentId]
    );
  }

  const teacher = await queryOne<{ name: string }>('select name from users where id = $1', [teacherId]);
  await notifyMany(input.studentIds, {
    title: 'New homework assigned',
    message: `${teacher?.name ?? 'Your teacher'} assigned "${input.title}" due ${input.dueDate}.`,
    type: 'homework_new',
    relatedId: id,
  });

  const created = await getHomework(id, { id: teacherId, role: 'admin' } as SessionUser);
  return created!;
}

export async function updateHomework(id: string, patch: Partial<HomeworkInput>): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const set = (col: string, value: unknown) => {
    params.push(value);
    sets.push(`${col} = $${params.length}`);
  };
  if (patch.title !== undefined) set('title', patch.title);
  if (patch.description !== undefined) set('description', patch.description);
  if (patch.dueDate !== undefined) set('due_date', patch.dueDate);
  if (patch.attachments !== undefined) set('attachments', JSON.stringify(patch.attachments));
  if (patch.studentIds !== undefined) set('student_ids', patch.studentIds);
  if (sets.length === 0) return;
  params.push(id);
  await query(`update homework set ${sets.join(', ')} where id = $${params.length}`, params);
}

export async function deleteHomework(id: string): Promise<void> {
  await query('delete from homework where id = $1', [id]);
  await query("delete from notifications where related_id = $1 and type in ('homework_due','homework_new')", [id]);
}

/** Student submits (or resubmits) work. */
export async function submitHomework(
  homeworkId: string,
  student: SessionUser,
  files: Attachment[],
  note?: string
): Promise<HomeworkSubmission> {
  const homework = await queryOne<HomeworkRow>('select * from homework where id = $1', [homeworkId]);
  if (!homework) throw new Error('Homework not found');
  if (!homework.student_ids.includes(student.id)) throw new Error('Not assigned to you');

  const existing = await queryOne<SubmissionRow>(
    'select * from homework_submissions where homework_id = $1 and student_id = $2',
    [homeworkId, student.id]
  );

  let id: string;
  if (existing) {
    id = existing.id;
    await query(
      `update homework_submissions
          set status = 'submitted', files = $1, note = $2, submitted_at = now(), feedback = null, reviewed_at = null
        where id = $3`,
      [JSON.stringify(files), note ?? null, id]
    );
  } else {
    id = randomUUID();
    await query(
      `insert into homework_submissions (id, homework_id, student_id, status, files, note, submitted_at)
       values ($1,$2,$3,'submitted',$4,$5,now())`,
      [id, homeworkId, student.id, JSON.stringify(files), note ?? null]
    );
  }

  await notify(homework.teacher_id, {
    title: 'Homework submitted',
    message: `${student.name} submitted "${homework.title}" for review.`,
    type: 'homework_new',
    relatedId: homeworkId,
  });

  const row = await queryOne<SubmissionRow>('select * from homework_submissions where id = $1', [id]);
  return mapSubmission(row!);
}

/** Teacher/admin reviews a submission and leaves feedback. */
export async function reviewSubmission(
  submissionId: string,
  reviewer: SessionUser,
  feedback: string
): Promise<HomeworkSubmission> {
  const row = await queryOne<SubmissionRow>('select * from homework_submissions where id = $1', [submissionId]);
  if (!row) throw new Error('Submission not found');

  await query(
    `update homework_submissions
        set status = 'reviewed', feedback = $1, reviewed_at = now(), reviewed_by = $2
      where id = $3`,
    [feedback, reviewer.id, submissionId]
  );

  const hw = await queryOne<{ title: string }>('select title from homework where id = $1', [row.homework_id]);
  await notify(row.student_id, {
    title: 'Homework reviewed',
    message: `Your work on "${hw?.title ?? 'an assignment'}" was reviewed with feedback.`,
    type: 'homework_reviewed',
    relatedId: row.homework_id,
  });

  const updated = await queryOne<SubmissionRow>(
    `select s.*, u.name as student_name from homework_submissions s
       join users u on u.id = s.student_id where s.id = $1`,
    [submissionId]
  );
  return mapSubmission(updated!);
}

/* ------------------------------------------------------- announcements */

function audienceClause(user: SessionUser, alias = 'a'): string {
  // Authors always see their own announcements, regardless of audience.
  const own = `${alias}.author_id = $1`;
  if (user.role === 'admin') return 'true';
  if (user.role === 'teacher') {
    return `(${own}
             or ${alias}.audience = '"all"'::jsonb or ${alias}.audience = '"teachers"'::jsonb
             or (jsonb_typeof(${alias}.audience) = 'array' and ${alias}.audience ? $1))`;
  }
  return `(${own}
           or ${alias}.audience = '"all"'::jsonb or ${alias}.audience = '"students"'::jsonb
           or (jsonb_typeof(${alias}.audience) = 'array' and ${alias}.audience ? $1))`;
}

export async function listAnnouncements(user: SessionUser): Promise<Announcement[]> {
  const rows = await query<AnnouncementRow>(
    `select a.*, r.read_at
       from announcements a
       left join announcement_reads r on r.announcement_id = a.id and r.user_id = $1
      where ${audienceClause(user)}
        and (a.created_at <= now() or a.author_id = $1)
      order by a.created_at desc`,
    [user.id]
  );
  return rows.map(mapAnnouncement);
}

export async function getAnnouncement(id: string, user: SessionUser): Promise<Announcement | null> {
  const rows = await query<AnnouncementRow>(
    `select a.*, r.read_at
       from announcements a
       left join announcement_reads r on r.announcement_id = a.id and r.user_id = $1
      where a.id = $2 and ${audienceClause(user)}`,
    [user.id, id]
  );
  return rows[0] ? mapAnnouncement(rows[0]) : null;
}

export interface AnnouncementInput {
  title: string;
  description: string;
  audience: 'all' | 'students' | 'teachers' | string[];
  attachments: AnnouncementAttachment[];
  publishAt?: string;
}

export async function createAnnouncement(
  input: AnnouncementInput,
  author: SessionUser
): Promise<Announcement> {
  const id = randomUUID();
  await query(
    `insert into announcements (id, title, description, author_id, author_name, author_role, audience, attachments, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8, coalesce($9::timestamptz, now()))`,
    [
      id, input.title, input.description, author.id, author.name, author.role,
      JSON.stringify(input.audience), JSON.stringify(input.attachments), input.publishAt ?? null,
    ]
  );

  const recipients = (await audienceToUserIds(input.audience)).filter((uid) => uid !== author.id);
  await notifyMany(recipients, {
    title: 'New announcement',
    message: `${author.name} posted: "${input.title}"`,
    type: 'announcement',
    relatedId: id,
  });

  const created = await getAnnouncement(id, author);
  return created!;
}

export async function updateAnnouncement(
  id: string,
  patch: Partial<AnnouncementInput>,
  actor: SessionUser
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const set = (col: string, value: unknown) => {
    params.push(value);
    sets.push(`${col} = $${params.length}`);
  };
  if (patch.title !== undefined) set('title', patch.title);
  if (patch.description !== undefined) set('description', patch.description);
  if (patch.audience !== undefined) set('audience', JSON.stringify(patch.audience));
  if (patch.attachments !== undefined) set('attachments', JSON.stringify(patch.attachments));
  if (sets.length === 0) return;
  set('updated_at', new Date());
  params.push(id);
  const idParam = params.length;
  if (actor.role === 'admin') {
    await query(`update announcements set ${sets.join(', ')} where id = $${idParam}`, params);
  } else {
    params.push(actor.id);
    await query(
      `update announcements set ${sets.join(', ')} where id = $${idParam} and author_id = $${idParam + 1}`,
      params
    );
  }
}

export async function deleteAnnouncement(id: string, actor: SessionUser): Promise<void> {
  if (actor.role === 'admin') {
    await query('delete from announcements where id = $1', [id]);
  } else {
    await query('delete from announcements where id = $1 and author_id = $2', [id, actor.id]);
  }
  await query("delete from notifications where related_id = $1 and type = 'announcement'", [id]);
}

export async function markAnnouncementRead(announcementId: string, userId: string): Promise<void> {
  await query(
    `insert into announcement_reads (announcement_id, user_id) values ($1, $2)
     on conflict (announcement_id, user_id) do update set read_at = now()`,
    [announcementId, userId]
  );
}

export async function unreadAnnouncementCount(userId: string, role: string): Promise<number> {
  const user = { id: userId, role } as SessionUser;
  const rows = await query<{ n: number }>(
    `select count(*)::int as n
       from announcements a
      where ${audienceClause(user)}
        and not exists (
          select 1 from announcement_reads r
           where r.announcement_id = a.id and r.user_id = $1
        )`,
    [userId]
  );
  return rows[0]?.n ?? 0;
}

/* ------------------------------------------------------------ students */

export async function listStudents(): Promise<(SessionUser & { classCount: number; homeworkCount: number })[]> {
  const students = await query<{
    id: string; name: string; email: string; role: string; avatar: string | null;
    student_id: string | null; teacher_id: string | null; class_ids: string[];
  }>("select * from users where role = 'student' order by name");

  const classCounts = await query<{ id: string; n: number }>(
    `select u.id, (select count(*)::int from class_sessions c where u.id = any(c.student_ids)) as n
       from users u where u.role = 'student'`
  );
  const hwCounts = await query<{ id: string; n: number }>(
    `select u.id, (select count(*)::int from homework h where u.id = any(h.student_ids)) as n
       from users u where u.role = 'student'`
  );
  const classMap = new Map(classCounts.map((c) => [c.id, c.n]));
  const hwMap = new Map(hwCounts.map((c) => [c.id, c.n]));

  return students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role as SessionUser['role'],
    avatar: s.avatar ?? undefined,
    studentId: s.student_id ?? undefined,
    teacherId: s.teacher_id ?? undefined,
    classIds: s.class_ids ?? [],
    classCount: classMap.get(s.id) ?? 0,
    homeworkCount: hwMap.get(s.id) ?? 0,
  }));
}

export interface StudentInput {
  name: string;
  email: string;
  studentId: string;
  classIds: string[];
}

export async function createStudent(input: StudentInput, password: string): Promise<SessionUser> {
  const { hashPassword } = await import('./password');
  const id = `student-${randomUUID().slice(0, 8)}`;
  await query(
    `insert into users (id, name, email, password_hash, role, student_id, class_ids)
     values ($1,$2,$3,$4,'student',$5,$6)`,
    [id, input.name, input.email, hashPassword(password), input.studentId, input.classIds]
  );
  return {
    id,
    name: input.name,
    email: input.email,
    role: 'student',
    studentId: input.studentId,
    classIds: input.classIds,
  };
}

export async function getStudent(id: string): Promise<SessionUser | null> {
  const row = await queryOne<Record<string, unknown>>('select * from users where id = $1 and role = $2', [
    id,
    'student',
  ]);
  if (!row) return null;
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: 'student',
    avatar: (row.avatar as string) ?? undefined,
    studentId: (row.student_id as string) ?? undefined,
    classIds: (row.class_ids as string[]) ?? [],
  };
}

/* ------------------------------------------------------- notifications */

export async function listNotifications(user: SessionUser): Promise<Notification[]> {
  const rows = await query<NotificationRow>(
    'select * from notifications where user_id = $1 order by created_at desc limit 100',
    [user.id]
  );
  return rows.map(mapNotification);
}

export async function markNotificationsRead(userId: string, ids?: string[]): Promise<void> {
  if (ids && ids.length > 0) {
    await query('update notifications set read = true where user_id = $1 and id = any($2)', [userId, ids]);
  } else {
    await query('update notifications set read = true where user_id = $1', [userId]);
  }
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const rows = await query<{ n: number }>(
    'select count(*)::int as n from notifications where user_id = $1 and read = false',
    [userId]
  );
  return rows[0]?.n ?? 0;
}

/* ----------------------------------------------------------- settings */

const DEFAULT_SETTINGS: AppSettings = {
  notifications: { classReminders: true, homeworkDueAlerts: true, announcementNotifications: true },
  general: { maintenanceMode: false, schoolName: 'Praticchhabi Drawing School' },
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await query<{ key: string; value: AppSettings[keyof AppSettings] }>(
    'select key, value from app_settings'
  );
  const settings: AppSettings = {
    notifications: { ...DEFAULT_SETTINGS.notifications },
    general: { ...DEFAULT_SETTINGS.general },
  };
  for (const row of rows) {
    if (row.key === 'notifications') settings.notifications = { ...settings.notifications, ...(row.value as object) } as AppSettings['notifications'];
    if (row.key === 'general') settings.general = { ...settings.general, ...(row.value as object) } as AppSettings['general'];
  }
  return settings;
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  await query(
    `insert into app_settings (key, value, updated_at) values ('notifications', $1, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(settings.notifications)]
  );
  await query(
    `insert into app_settings (key, value, updated_at) values ('general', $1, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(settings.general)]
  );
  return settings;
}
