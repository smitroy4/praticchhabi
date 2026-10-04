import { requireRole } from '@/lib/server/auth';

export default async function TeacherAreaLayout({ children }: { children: React.ReactNode }) {
  await requireRole('teacher');
  return <>{children}</>;
}
