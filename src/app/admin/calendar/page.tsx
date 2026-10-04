'use client';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar } from '@/components/student/Calendar';
import { useAsync } from '@/lib/useAsync';
import { classesApi } from '@/lib/api';

export default function AdminCalendarPage() {
  const { data, error, loading, reload } = useAsync(() => classesApi.list(), []);

  return (
    <AppShell role="admin" showBottomNav showTopBar topBarTitle="Calendar">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Calendar"
          description="Manage all class schedules"
        />

        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading calendar">
            <div className="h-9 w-1/3 bg-muted rounded-lg animate-pulse" />
            <div className="h-80 bg-muted rounded-xl animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <EmptyState
            title="Could not load calendar"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        )}

        {!loading && !error && data && <Calendar classes={data.classes} mode="month" />}
      </div>
    </AppShell>
  );
}
