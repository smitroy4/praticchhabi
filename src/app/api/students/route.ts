import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { listStudents, createStudent, type StudentInput } from '@/lib/server/repo';

export async function GET() {
  const auth = await requireUser(['admin', 'teacher']);
  if (!auth.ok) return guarded(auth);
  const students = await listStudents();
  return json({ students });
}

export async function POST(request: Request) {
  const auth = await requireUser(['admin']);
  if (!auth.ok) return guarded(auth);

  const body = await request.json().catch(() => ({}));
  const input = body as StudentInput;
  if (!input.name?.trim()) return apiError(400, 'Name is required');
  if (!input.email?.trim()) return apiError(400, 'Email is required');
  if (!input.studentId?.trim()) return apiError(400, 'Student ID is required');

  try {
    const student = await createStudent(
      {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        studentId: input.studentId.trim().toUpperCase(),
        classIds: input.classIds ?? [],
      },
      body.password ? String(body.password) : 'demo'
    );
    return json({ student }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error && err.message.includes('unique')
      ? 'A student with that email already exists'
      : 'Could not create the student';
    return apiError(400, message);
  }
}
