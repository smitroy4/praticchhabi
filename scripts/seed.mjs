/**
 * Applies db/schema.sql and seeds Praticchhabi demo data.
 *
 *   node scripts/seed.mjs           # apply schema + insert missing rows (idempotent)
 *   node scripts/seed.mjs --reset   # drop all data and re-seed from scratch
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESET = process.argv.includes('--reset');

const envFile = readFileSync(path.join(ROOT, '.env.local'), 'utf8');
const DATABASE_URL = envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

// --- password hashing (mirrors src/lib/server/password.ts) ---
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  const [, salt, hash] = stored.split('$');
  return scryptSync(password, salt, 64).toString('hex') === hash;
}
if (!verifyPassword('demo', hashPassword('demo'))) {
  console.error('self-check failed: password hashing');
  process.exit(1);
}

// --- placeholder assets (so seeded attachment links are not 404s) ---
function makePdf(text) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null, // content stream filled below
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = `BT /F1 24 Tf 72 720 Td (${text.replace(/[()\\]/g, '\\$&')}) Tj ET`;
  objects[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;

  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

function makeSvg(label, color) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<rect width="800" height="600" fill="${color}"/>
<rect x="24" y="24" width="752" height="552" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3"/>
<text x="400" y="310" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#ffffff">${label}</text>
<text x="400" y="360" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#ffffff" fill-opacity="0.8">Praticchhabi Drawing School</text>
</svg>`,
    'utf8'
  );
}

function writeAssets() {
  const dir = path.join(ROOT, 'public', 'attachments');
  mkdirSync(dir, { recursive: true });
  const files = {
    'still-life-reference.pdf': makePdf('Still Life Reference - Praticchhabi'),
    'schedule-update.pdf': makePdf('Class Schedule Update - Praticchhabi'),
    'shading-techniques.svg': makeSvg('Shading Techniques', '#7a9a8a'),
    'portrait-reference.svg': makeSvg('Portrait Reference', '#c46b4d'),
    'watercolor-guide.svg': makeSvg('Watercolor Guide', '#6b8a7c'),
    'exhibition-poster.svg': makeSvg('Annual Art Exhibition', '#a89f95'),
  };
  for (const [name, buf] of Object.entries(files)) {
    const p = path.join(dir, name);
    if (!existsSync(p)) writeFileSync(p, buf);
  }
  return Object.keys(files);
}

// --- seed content (mirrors src/data/mockData.ts, dates relative to today) ---
const DAY = 86400000;
const now = new Date();
const iso = (d) => d.toISOString().split('T')[0];
const shift = (n) => iso(new Date(now.getTime() + n * DAY));

const users = [
  ['admin-1', 'Admin User', 'admin@praticchhabi.com', 'admin', '/avatars/admin.jpg', null, null, []],
  ['teacher-1', 'Debraj Dasgupta', 'debraj@praticchhabi.com', 'teacher', '/avatars/debraj.jpg', null, 'TCH001', ['class-1', 'class-2', 'class-3']],
  ['student-1', 'Priyangshi Roy', 'priyangshi@praticchhabi.com', 'student', '/avatars/priyangshi.jpg', 'STU001', null, ['class-1', 'class-2']],
  ['student-2', 'Sabarni Kundu', 'sabarni@praticchhabi.com', 'student', '/avatars/sabarni.jpg', 'STU002', null, ['class-1', 'class-3']],
  ['student-3', 'Ankush Das', 'ankush@praticchhabi.com', 'student', '/avatars/ankush.jpg', 'STU003', null, ['class-2', 'class-3']],
];

const allStudents = ['student-1', 'student-2', 'student-3'];

const classes = [
  ['class-1', 'Drawing & Composition Fundamentals', 'Basic drawing techniques and composition principles', shift(0), '17:00', '18:30', 'offline', null, 'Studio A', ['student-1', 'student-2']],
  ['class-2', 'Portrait Drawing Workshop', 'Learn facial proportions and shading techniques', shift(0), '18:45', '20:15', 'online', 'https://meet.google.com/abc-defg-hij', null, ['student-1', 'student-3']],
  ['class-3', 'Still Life & Shading Practice', 'Practice shading techniques with charcoal and graphite', shift(1), '17:00', '18:30', 'offline', null, 'Studio A', ['student-2', 'student-3']],
  ['class-4', 'Watercolor Basics', 'Introduction to watercolor techniques and color mixing', shift(2), '16:00', '17:30', 'offline', null, 'Studio B', allStudents],
  ['class-5', 'Perspective Drawing', 'One-point and two-point perspective fundamentals', shift(7), '17:00', '18:30', 'online', 'https://meet.google.com/xyz-uvw-rst', null, allStudents],
  ['class-6', 'Gesture Drawing Session', 'Quick gesture drawings from life', shift(-7), '17:00', '18:30', 'offline', null, 'Studio A', allStudents],
  // recurring series example: every week for 4 weeks
  ['class-r1', 'Weekly Life Drawing (Recurring)', 'Recurring weekly session - bring your sketchbook', shift(3), '17:30', '19:00', 'offline', null, 'Studio A', allStudents, { recurrence: 'weekly', until: shift(24) }],
];

const hwAttachments = {
  hw1: [
    { id: 'att-1', name: 'Still_Life_Reference.pdf', type: 'pdf', url: '/attachments/still-life-reference.pdf', size: 2457600 },
    { id: 'att-2', name: 'Shading_Techniques.svg', type: 'image', url: '/attachments/shading-techniques.svg', thumbnailUrl: '/attachments/shading-techniques.svg', size: 102400 },
  ],
  hw2: [{ id: 'att-3', name: 'Portrait_Reference.svg', type: 'image', url: '/attachments/portrait-reference.svg', thumbnailUrl: '/attachments/portrait-reference.svg', size: 85600 }],
  hw3: [{ id: 'att-4', name: 'Watercolor_Guide.svg', type: 'image', url: '/attachments/watercolor-guide.svg', thumbnailUrl: '/attachments/watercolor-guide.svg', size: 92160 }],
};

const homework = [
  ['hw-1', 'Pencil Shading Practice', 'Practice five different shading techniques using graphite pencils. Focus on smooth gradients and controlled pressure.', shift(-7), shift(2), 'class-1', allStudents, hwAttachments.hw1],
  ['hw-2', 'Portrait Study - Front View', 'Complete a front-view portrait study using the reference image. Pay attention to proportions and facial features.', shift(-10), shift(1), 'class-2', ['student-1', 'student-3'], hwAttachments.hw2],
  ['hw-3', 'Watercolor Color Wheel', 'Create a 12-color watercolor wheel demonstrating primary, secondary, and tertiary color mixing.', shift(-12), shift(7), 'class-4', allStudents, hwAttachments.hw3],
  ['hw-4', 'Gesture Drawing Series', 'Complete 20 gesture drawings (30 seconds each) from life or reference photos.', shift(-14), shift(-7), 'class-6', allStudents, []],
];

const submissions = [
  // reviewed
  ...allStudents.map((sid, i) => [
    `sub-hw4-${sid}`, 'hw-4', sid, 'reviewed',
    [{ id: `sub-att-${i}`, name: 'Gesture_Series.jpg', type: 'image', url: '/attachments/shading-techniques.svg', thumbnailUrl: '/attachments/shading-techniques.svg' }],
    'Submitted all 20 drawings.', shift(-8),
    'Good energy in the lines. Work on holding the gesture for longer before detailing.', shift(-6), 'teacher-1',
  ]),
  // awaiting review
  ['sub-hw2-student-1', 'hw-2', 'student-1', 'submitted',
    [{ id: 'sub-att-3', name: 'Portrait_Study.png', type: 'image', url: '/attachments/portrait-reference.svg', thumbnailUrl: '/attachments/portrait-reference.svg' }],
    'Front view study attached.', shift(-1), null, null, null],
];

const announcements = [
  ['ann-1', 'Annual Art Exhibition - Call for Submissions', 'Students participating in the annual exhibition should submit their final artwork by October 15th. The exhibition will be held at the school gallery from November 1-15. All mediums welcome - drawing, painting, mixed media, and digital art.', 'teacher-1', 'Debraj Dasgupta', 'teacher', '"all"', [{ id: 'ann-att-1', name: 'Exhibition_Poster.svg', type: 'image', url: '/attachments/exhibition-poster.svg', thumbnailUrl: '/attachments/exhibition-poster.svg' }], -1],
  ['ann-2', 'Updated Class Schedule for Next Month', 'Please review the attached schedule for next month classes. Note that Week 2 classes have been shifted by 30 minutes due to a gallery visit.', 'admin-1', 'Admin User', 'admin', '"students"', [{ id: 'ann-att-2', name: 'Schedule_Update.pdf', type: 'pdf', url: '/attachments/schedule-update.pdf' }], -2],
  ['ann-3', 'New Reference Materials Available', 'I have uploaded new reference images and video tutorials for the upcoming watercolor module. Check the homework section for the "Watercolor Color Wheel" assignment.', 'teacher-1', 'Debraj Dasgupta', 'teacher', '"students"', [], -4],
  ['ann-4', 'Welcome to Praticchhabi Drawing School!', 'Welcome to our new students! We are excited to have you join our creative community. Your first class materials are available in the homework section. Do not hesitate to reach out if you have any questions.', 'admin-1', 'Admin User', 'admin', '"all"', [], -10],
];

// ann-4 already read by everyone, ann-3 read by student-1 -> leaves ann-1/ann-2 unread
const announcementReads = [
  ...allStudents.map((sid) => ['ann-4', sid]),
  ['ann-3', 'student-1'],
  ['ann-4', 'teacher-1'],
  ['ann-4', 'admin-1'],
  ['ann-3', 'admin-1'],
];

const notifications = [
  ['notif-1', 'student-1', 'Homework Due Tomorrow', 'Your assignment "Portrait Study - Front View" is due tomorrow.', 'homework_due', false, 'hw-2', -0.5],
  ['notif-2', 'student-1', 'New Announcement', 'Debraj Dasgupta posted: "Annual Art Exhibition - Call for Submissions"', 'announcement', false, 'ann-1', -1],
  ['notif-3', 'student-1', 'New Homework Assigned', 'Debraj Dasgupta assigned "Watercolor Color Wheel" due in 1 week.', 'homework_new', true, 'hw-3', -3],
  ['notif-4', 'teacher-1', 'Homework Submitted', 'Priyangshi Roy submitted "Portrait Study - Front View" for review.', 'homework_new', false, 'hw-2', -1],
  ['notif-5', 'admin-1', 'System Ready', 'Praticchhabi is connected to the database. Welcome aboard!', 'general', true, null, -5],
];

const settings = [
  ['notifications', { classReminders: true, homeworkDueAlerts: true, announcementNotifications: true }],
  ['general', { maintenanceMode: false, schoolName: 'Praticchhabi Drawing School' }],
];

async function main() {
  writeAssets();
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const schema = readFileSync(path.join(ROOT, 'db', 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('schema applied');

    if (RESET) {
      await client.query(`
        truncate table app_settings, notifications, announcement_reads, announcements,
          homework_submissions, homework, class_sessions, sessions, users cascade
      `);
      console.log('existing data truncated');
    }

    const pw = hashPassword('demo');
    let inserted = 0;

    for (const [id, name, email, role, avatar, studentId, teacherId, classIds] of users) {
      const r = await client.query(
        `insert into users (id, name, email, password_hash, role, avatar, student_id, teacher_id, class_ids)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (id) do nothing`,
        [id, name, email, pw, role, avatar, studentId, teacherId, classIds]
      );
      inserted += r.rowCount;
    }

    for (const row of classes) {
      const [id, title, description, date, startTime, endTime, type, meetingUrl, location, studentIds, recurrence] = row;
      const rec = recurrence?.recurrence ?? 'none';
      const until = recurrence?.until ?? null;
      const r = await client.query(
        `insert into class_sessions
           (id, title, description, date, start_time, end_time, duration_minutes, teacher_id, type,
            meeting_url, location, student_ids, recurrence, recurrence_until, series_id)
         values ($1,$2,$3,$4,$5,$6,90,$7,$8,$9,$10,$11,$12,$13,$14)
         on conflict (id) do nothing`,
        [id, title, description, date, startTime, endTime, 'teacher-1', type, meetingUrl, location, studentIds, rec, until, rec === 'none' ? null : id]
      );
      inserted += r.rowCount;
      // materialise the rest of a recurring series
      if (r.rowCount > 0 && rec !== 'none') await expandSeries(client, { id, title, description, date, startTime, endTime, type, meetingUrl, location, studentIds, rec, until });
    }

    for (const [id, title, description, assignedDate, dueDate, classId, studentIds, attachments] of homework) {
      const r = await client.query(
        `insert into homework (id, title, description, assigned_date, due_date, teacher_id, class_id, student_ids, attachments)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing`,
        [id, title, description, assignedDate, dueDate, 'teacher-1', classId, studentIds, JSON.stringify(attachments)]
      );
      inserted += r.rowCount;
    }

    for (const [id, homeworkId, studentId, status, files, note, submittedAt, feedback, reviewedAt, reviewedBy] of submissions) {
      const r = await client.query(
        `insert into homework_submissions
           (id, homework_id, student_id, status, files, note, submitted_at, feedback, reviewed_at, reviewed_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (id) do nothing`,
        [id, homeworkId, studentId, status, JSON.stringify(files), note, submittedAt, feedback, reviewedAt, reviewedBy]
      );
      inserted += r.rowCount;
    }

    for (const [id, title, description, authorId, authorName, authorRole, audience, attachments, daysAgo] of announcements) {
      const r = await client.query(
        `insert into announcements (id, title, description, author_id, author_name, author_role, audience, attachments, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing`,
        [id, title, description, authorId, authorName, authorRole, audience, JSON.stringify(attachments), new Date(now.getTime() + daysAgo * DAY)]
      );
      inserted += r.rowCount;
    }

    for (const [announcementId, userId] of announcementReads) {
      const r = await client.query(
        `insert into announcement_reads (announcement_id, user_id) values ($1,$2)
         on conflict (announcement_id, user_id) do nothing`,
        [announcementId, userId]
      );
      inserted += r.rowCount;
    }

    for (const [id, userId, title, message, type, read, relatedId, daysAgo] of notifications) {
      const r = await client.query(
        `insert into notifications (id, user_id, title, message, type, read, related_id, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do nothing`,
        [id, userId, title, message, type, read, relatedId, new Date(now.getTime() + daysAgo * DAY)]
      );
      inserted += r.rowCount;
    }

    for (const [key, value] of settings) {
      const r = await client.query(
        `insert into app_settings (key, value) values ($1,$2)
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [key, JSON.stringify(value)]
      );
      inserted += r.rowCount;
    }

    const counts = {};
    for (const t of ['users', 'class_sessions', 'homework', 'homework_submissions', 'announcements', 'announcement_reads', 'notifications']) {
      counts[t] = (await client.query(`select count(*)::int as n from ${t}`)).rows[0].n;
    }
    console.log(`seed complete (${inserted} new rows)`);
    console.log(counts);
    console.log('login with any seeded email + password: demo');
  } finally {
    await client.end();
  }
}

async function expandSeries(client, s) {
  const start = new Date(`${s.date}T00:00:00`);
  const end = s.until ? new Date(`${s.until}T00:00:00`) : null;
  const stepDays = { daily: 1, weekly: 7, biweekly: 14, monthly: 28 }[s.rec] ?? 7;
  let cursor = new Date(start.getTime() + stepDays * DAY);
  let n = 1;
  const idBase = s.id.replace(/^class-/, '');
  while ((end === null && n < 8) || (end !== null && cursor <= end && n < 12)) {
    const id = `class-${idBase}-r${n + 1}`;
    await client.query(
      `insert into class_sessions
         (id, title, description, date, start_time, end_time, duration_minutes, teacher_id, type,
          meeting_url, location, student_ids, recurrence, recurrence_until, series_id)
       values ($1,$2,$3,$4,$5,$6,90,$7,$8,$9,$10,$11,$12,$13,$14) on conflict (id) do nothing`,
      [id, s.title, s.description, iso(cursor), s.startTime, s.endTime, 'teacher-1', s.type,
       s.meetingUrl, s.location, s.studentIds, s.rec, s.until, s.id]
    );
    cursor = new Date(cursor.getTime() + stepDays * DAY);
    n++;
  }
}

main().catch((e) => {
  console.error('SEED FAILED:', e.message);
  process.exit(1);
});
