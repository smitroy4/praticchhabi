import { requireRole } from '@/lib/server/auth';

export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin');
  return <>{children}</>;
}
