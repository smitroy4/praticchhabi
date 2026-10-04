import { requireRole } from '@/lib/server/auth';

export default async function StudentAreaLayout({ children }: { children: React.ReactNode }) {
  await requireRole('student');
  return <>{children}</>;
}
