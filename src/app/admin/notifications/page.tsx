'use client';

import { AppShell } from '@/components/layout/AppShell';
import { NotificationsPage } from '@/components/notifications/NotificationsPage';

export default function AdminNotificationsPage() {
  return (
    <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="Notifications">
      <NotificationsPage />
    </AppShell>
  );
}
