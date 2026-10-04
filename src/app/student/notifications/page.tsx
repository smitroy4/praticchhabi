'use client';

import { AppShell } from '@/components/layout/AppShell';
import { NotificationsPage } from '@/components/notifications/NotificationsPage';

export default function StudentNotificationsPage() {
  return (
    <AppShell role="student" showBottomNav showTopBar topBarTitle="Notifications">
      <NotificationsPage />
    </AppShell>
  );
}
