export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export interface Student extends User {
  role: 'student';
  studentId: string;
  classIds: string[];
}

export interface Teacher extends User {
  role: 'teacher';
  teacherId: string;
  classIds: string[];
}

export interface Admin extends User {
  role: 'admin';
}

export type ClassType = 'offline' | 'online';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface ClassSession {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  teacherId: string;
  teacherName?: string;
  type: ClassType;
  meetingUrl?: string;
  location?: string;
  studentIds: string[];
  description?: string;
  recurrence?: Recurrence;
  seriesId?: string | null;
}

export type AttachmentType = 'image' | 'pdf' | 'video' | 'file';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  thumbnailUrl?: string;
  size?: number;
}

export type HomeworkAttachment = Attachment;

export type HomeworkStatus = 'pending' | 'submitted' | 'reviewed' | 'completed' | 'overdue';

export type SubmissionStatus = 'pending' | 'submitted' | 'reviewed';

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName?: string;
  status: SubmissionStatus;
  files: Attachment[];
  note?: string | null;
  submittedAt?: string | null;
  feedback?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  teacherId: string;
  teacherName?: string;
  studentIds: string[];
  classId?: string | null;
  attachments: HomeworkAttachment[];
  status: HomeworkStatus;
  /** present for the requesting student */
  submission?: HomeworkSubmission | null;
  /** staff-only counters */
  submissionCounts?: { total: number; pending: number; submitted: number; reviewed: number };
}

export type AnnouncementAttachment = Attachment;

export interface Announcement {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'teacher';
  createdAt: string;
  updatedAt?: string | null;
  attachments: AnnouncementAttachment[];
  audience: 'all' | 'students' | 'teachers' | string[];
  /** true when the requesting user has opened it */
  read?: boolean;
}

export type NotificationType =
  | 'class_reminder'
  | 'homework_due'
  | 'homework_new'
  | 'homework_reviewed'
  | 'announcement'
  | 'general';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  relatedId?: string | null;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  studentId?: string;
  teacherId?: string;
  classIds?: string[];
}

export interface AppNotificationSettings {
  classReminders: boolean;
  homeworkDueAlerts: boolean;
  announcementNotifications: boolean;
}

export interface AppGeneralSettings {
  maintenanceMode: boolean;
  schoolName: string;
}

export interface AppSettings {
  notifications: AppNotificationSettings;
  general: AppGeneralSettings;
}
