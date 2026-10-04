import { randomUUID } from 'node:crypto';
import { query, queryOne } from './db';
import type { NotificationType, UserRole } from '@/types';

export async function notify(
  userId: string,
  notification: { title: string; message: string; type: NotificationType; relatedId?: string | null }
): Promise<void> {
  await query(
    `insert into notifications (id, user_id, title, message, type, related_id)
     values ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), userId, notification.title, notification.message, notification.type, notification.relatedId ?? null]
  );
}

export async function notifyMany(
  userIds: string[],
  notification: { title: string; message: string; type: NotificationType; relatedId?: string | null }
): Promise<number> {
  const unique = [...new Set(userIds)];
  let count = 0;
  for (const userId of unique) {
    await notify(userId, notification);
    count++;
  }
  return count;
}

/** Resolves announcement audiences ("all" | "students" | "teachers" | [user ids]) to user ids. */
export async function audienceToUserIds(
  audience: 'all' | 'students' | 'teachers' | string[]
): Promise<string[]> {
  if (Array.isArray(audience)) return audience;
  if (audience === 'all') {
    const rows = await query<{ id: string }>('select id from users');
    return rows.map((r) => r.id);
  }
  const role: UserRole = audience === 'teachers' ? 'teacher' : 'student';
  const rows = await query<{ id: string }>('select id from users where role = $1', [role]);
  return rows.map((r) => r.id);
}

/**
 * Derives time-based notifications (class reminders + homework due alerts) for a user.
 * Idempotent: guarded by (related_id, type, user_id) existence.
 */
export async function ensureAutomaticReminders(userId: string): Promise<void> {
  const settings = await queryOne<{ value: { classReminders?: boolean; homeworkDueAlerts?: boolean } }>(
    "select value from app_settings where key = 'notifications'"
  );
  const classReminders = settings?.value?.classReminders !== false;
  const homeworkAlerts = settings?.value?.homeworkDueAlerts !== false;

  if (classReminders) {
    await query(
      `insert into notifications (id, user_id, title, message, type, related_id)
       select gen_random_uuid()::text, u.id,
              'Class starting soon',
              'Your class "' || c.title || '" starts ' ||
                case when c.date = current_date then 'today' else 'on ' || c.date end ||
                ' at ' || c.start_time || '.',
              'class_reminder', c.id
         from class_sessions c
         join users u on (u.id = any(c.student_ids) or u.id = c.teacher_id)
        where u.id = $1
          and (c.date + c.start_time::time) > now()
          and (c.date + c.start_time::time) <= now() + interval '24 hours'
          and not exists (
            select 1 from notifications n
             where n.user_id = u.id and n.related_id = c.id and n.type = 'class_reminder'
          )`,
      [userId]
    );
  }

  if (homeworkAlerts) {
    await query(
      `insert into notifications (id, user_id, title, message, type, related_id)
       select gen_random_uuid()::text, u.id,
              'Homework due soon',
              '"' || h.title || '" is due ' ||
                case when h.due_date = current_date then 'today' else 'tomorrow' end || '.',
              'homework_due', h.id
         from homework h
         join users u on u.id = any(h.student_ids)
        where u.id = $1
          and h.due_date between current_date and current_date + 1
          and not exists (
            select 1 from homework_submissions s
             where s.homework_id = h.id and s.student_id = u.id and s.status <> 'pending'
          )
          and not exists (
            select 1 from notifications n
             where n.user_id = u.id and n.related_id = h.id and n.type = 'homework_due'
          )`,
      [userId]
    );
  }
}
