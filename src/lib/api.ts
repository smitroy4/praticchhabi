import type {
  Announcement,
  AppSettings,
  Attachment,
  ClassSession,
  DemoUser,
  Homework,
  HomeworkAttachment,
  HomeworkSubmission,
  Notification,
  Recurrence,
} from '@/types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
}

async function request<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error ?? res.statusText, res.status);
  }
  return data as T;
}

/* ------------------------------------------------------------------ auth */

export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: DemoUser & { classIds: string[] } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST', body: {} }),
  me: () =>
    request<{ user: (DemoUser & { classIds: string[] }) | null; unreadAnnouncements?: number }>(
      '/api/auth/me'
    ),
};

/* --------------------------------------------------------------- classes */

export interface ClassPayload {
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

export const classesApi = {
  list: (params?: { from?: string; to?: string }) => {
    const search = new URLSearchParams();
    if (params?.from) search.set('from', params.from);
    if (params?.to) search.set('to', params.to);
    const qs = search.toString();
    return request<{ classes: ClassSession[] }>(`/api/classes${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<{ class: ClassSession }>(`/api/classes/${id}`),
  create: (input: ClassPayload) =>
    request<{ class: ClassSession }>('/api/classes', { method: 'POST', body: input }),
  update: (id: string, patch: Partial<ClassPayload>) =>
    request<{ class: ClassSession }>(`/api/classes/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: string) => request<{ ok: true }>(`/api/classes/${id}`, { method: 'DELETE' }),
};

/* ---------------------------------------------------------- announcements */

export interface AnnouncementPayload {
  title: string;
  description: string;
  audience: 'all' | 'students' | 'teachers' | string[];
  attachments: Announcement['attachments'];
  publishAt?: string;
}

export const announcementsApi = {
  list: () => request<{ announcements: Announcement[]; unreadCount: number }>('/api/announcements'),
  get: (id: string) => request<{ announcement: Announcement }>(`/api/announcements/${id}`),
  create: (input: AnnouncementPayload) =>
    request<{ announcement: Announcement }>('/api/announcements', { method: 'POST', body: input }),
  update: (id: string, patch: Partial<AnnouncementPayload>) =>
    request<{ announcement: Announcement }>(`/api/announcements/${id}`, {
      method: 'PATCH',
      body: patch,
    }),
  remove: (id: string) => request<{ ok: true }>(`/api/announcements/${id}`, { method: 'DELETE' }),
  markRead: (id: string) =>
    request<{ ok: true; unreadCount: number }>(`/api/announcements/${id}/read`, {
      method: 'POST',
      body: {},
    }),
};

/* -------------------------------------------------------------- homework */

export interface HomeworkPayload {
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  classId?: string | null;
  studentIds: string[];
  attachments: HomeworkAttachment[];
}

export const homeworkApi = {
  list: () => request<{ homework: Homework[] }>('/api/homework'),
  get: (id: string) => request<{ homework: Homework }>(`/api/homework/${id}`),
  create: (input: HomeworkPayload) =>
    request<{ homework: Homework }>('/api/homework', { method: 'POST', body: input }),
  update: (id: string, patch: Partial<HomeworkPayload>) =>
    request<{ homework: Homework }>(`/api/homework/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: string) => request<{ ok: true }>(`/api/homework/${id}`, { method: 'DELETE' }),
  submit: (id: string, files: Attachment[], note?: string) =>
    request<{ submission: HomeworkSubmission }>(`/api/homework/${id}/submit`, {
      method: 'POST',
      body: { files, note },
    }),
  submissions: (id: string) =>
    request<{ submissions: HomeworkSubmission[] }>(`/api/homework/${id}/submissions`),
  review: (submissionId: string, feedback: string) =>
    request<{ submission: HomeworkSubmission }>(`/api/submissions/${submissionId}`, {
      method: 'PATCH',
      body: { feedback },
    }),
};

/* -------------------------------------------------------------- students */

export interface StudentListEntry extends DemoUser {
  classIds: string[];
  classCount?: number;
  homeworkCount?: number;
}

export const studentsApi = {
  list: () => request<{ students: StudentListEntry[] }>('/api/students'),
  get: (id: string) =>
    request<{
      student: DemoUser;
      classCount: number;
      homeworkCount: number;
      pendingCount: number;
      submittedCount: number;
      activity: { id: string; title: string; status: string; submittedAt: Date | null; reviewedAt: Date | null }[];
    }>(`/api/students/${id}`),
  create: (input: { name: string; email: string; studentId: string; classIds: string[]; password?: string }) =>
    request<{ student: DemoUser }>('/api/students', { method: 'POST', body: input }),
};

/* ---------------------------------------------------------- notifications */

export const notificationsApi = {
  list: () => request<{ notifications: Notification[]; unreadCount: number }>('/api/notifications'),
  markRead: (ids?: string[]) =>
    request<{ ok: true; unreadCount: number }>('/api/notifications/read', {
      method: 'POST',
      body: { ids },
    }),
};

/* -------------------------------------------------------------- settings */

export const settingsApi = {
  get: () => request<{ settings: AppSettings }>('/api/settings'),
  save: (settings: AppSettings) =>
    request<{ settings: AppSettings }>('/api/settings', { method: 'PUT', body: settings }),
};

/* --------------------------------------------------------------- uploads */

export const uploadsApi = {
  upload: async (files: File[]): Promise<Attachment[]> => {
    const form = new FormData();
    for (const file of files) form.append('files', file);
    const res = await fetch('/api/uploads', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError((data as { error?: string }).error ?? res.statusText, res.status);
    }
    return (data as { attachments: Attachment[] }).attachments;
  },
};
