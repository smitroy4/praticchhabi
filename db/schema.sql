-- Praticchhabi schema (PostgreSQL / Neon)
-- Applied idempotently by scripts/seed.mjs

create extension if not exists pgcrypto;

create table if not exists users (
  id            text primary key,
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null check (role in ('admin', 'teacher', 'student')),
  avatar        text,
  student_id    text,
  teacher_id    text,
  class_ids     text[] not null default '{}',
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  token      text primary key,
  user_id    text not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions(user_id);

create table if not exists class_sessions (
  id               text primary key,
  title            text not null,
  description      text,
  date             date not null,
  start_time       text not null,
  end_time         text not null,
  duration_minutes int not null default 90,
  teacher_id       text not null references users(id),
  type             text not null check (type in ('offline', 'online')),
  meeting_url      text,
  location         text,
  student_ids      text[] not null default '{}',
  recurrence       text not null default 'none'
                   check (recurrence in ('none', 'daily', 'weekly', 'biweekly', 'monthly')),
  recurrence_until date,
  series_id        text,
  created_at       timestamptz not null default now()
);
create index if not exists class_sessions_date_idx on class_sessions(date);
create index if not exists class_sessions_series_idx on class_sessions(series_id);

create table if not exists homework (
  id             text primary key,
  title          text not null,
  description    text not null,
  assigned_date  date not null,
  due_date       date not null,
  teacher_id     text not null references users(id),
  class_id       text references class_sessions(id) on delete set null,
  student_ids    text[] not null default '{}',
  attachments    jsonb not null default '[]',
  created_at     timestamptz not null default now()
);
create index if not exists homework_due_idx on homework(due_date);

create table if not exists homework_submissions (
  id           text primary key,
  homework_id  text not null references homework(id) on delete cascade,
  student_id   text not null references users(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'submitted', 'reviewed')),
  files        jsonb not null default '[]',
  note         text,
  submitted_at timestamptz,
  feedback     text,
  reviewed_at  timestamptz,
  reviewed_by  text references users(id),
  created_at   timestamptz not null default now(),
  unique (homework_id, student_id)
);
create index if not exists submissions_homework_idx on homework_submissions(homework_id);
create index if not exists submissions_student_idx on homework_submissions(student_id);

create table if not exists announcements (
  id          text primary key,
  title       text not null,
  description text not null,
  author_id   text not null references users(id),
  author_name text not null,
  author_role text not null check (author_role in ('admin', 'teacher')),
  audience    jsonb not null default '"all"'::jsonb,
  attachments jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
create index if not exists announcements_created_idx on announcements(created_at desc);

create table if not exists announcement_reads (
  announcement_id text not null references announcements(id) on delete cascade,
  user_id         text not null references users(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create table if not exists notifications (
  id         text primary key,
  user_id    text not null references users(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null check (type in (
               'class_reminder', 'homework_due', 'homework_new',
               'homework_reviewed', 'announcement', 'general')),
  read       boolean not null default false,
  related_id text,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id, created_at desc);

create table if not exists app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
