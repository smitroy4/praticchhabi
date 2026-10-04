import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import type { Attachment, AttachmentType } from '@/types';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
};

function attachmentType(mime: string): AttachmentType {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'pdf';
  return 'file';
}

export async function POST(request: Request) {
  const auth = await requireUser(['admin', 'teacher', 'student']);
  if (!auth.ok) return guarded(auth);

  const form = await request.formData().catch(() => null);
  if (!form) return apiError(400, 'Expected multipart form data');

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return apiError(400, 'No files provided');
  if (files.length > 10) return apiError(400, 'You can upload at most 10 files at once');

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });

  const attachments: Attachment[] = [];
  for (const file of files) {
    const ext = EXTENSIONS[file.type];
    if (!ext) return apiError(400, `Unsupported file type: ${file.type || 'unknown'}`);
    if (file.size > MAX_SIZE) return apiError(400, `"${file.name}" is larger than 10 MB`);

    const id = randomUUID();
    const filename = `${id.slice(0, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

    attachments.push({
      id,
      name: file.name,
      type: attachmentType(file.type),
      url: `/uploads/${filename}`,
      size: file.size,
    });
  }

  return json({ attachments }, { status: 201 });
}
