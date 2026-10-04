'use client';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { AnnouncementCard } from '@/components/student/AnnouncementCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { announcementsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function StudentAnnouncementsPage() {
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(() => announcementsApi.list(), []);
  const announcements = data?.announcements ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <AppShell role="student" showBottomNav showTopBar topBarTitle="Announcements">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Announcements"
          description={unread > 0 ? `You have ${unread} unread announcement${unread === 1 ? '' : 's'}` : 'Stay updated with the latest news from your school'}
        />

        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading announcements">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState
            illustration="announcements"
            title="Could not load announcements"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        )}

        {!loading && !error && announcements.length > 0 && (
          <div className="space-y-3">
            {announcements.map(announcement => (
              <AnnouncementCard key={announcement.id} announcement={announcement} variant="feed" onClick={() => router.push(`/student/announcements/${announcement.id}`)} />
            ))}
          </div>
        )}

        {!loading && !error && announcements.length === 0 && (
          <EmptyState
            illustration="announcements"
            title="No announcements yet"
            description="New announcements from your teacher and admin will appear here."
          />
        )}
      </div>
    </AppShell>
  );
}
