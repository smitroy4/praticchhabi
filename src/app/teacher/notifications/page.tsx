'use client';

import { AppShell } from '@/components/layout/AppShell';
import { NotificationsPage } from '@/components/notifications/NotificationsPage';

export default function TeacherNotificationsPage() {
  return (
    <AppShell role="teacher" showBottomNav={false} showTopBar topBarTitle="Notifications">
      <NotificationsPage />
    </AppShell>
  );
}
