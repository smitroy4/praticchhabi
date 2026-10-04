'use client';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar } from '@/components/student/Calendar';
import { useAsync } from '@/lib/useAsync';
import { classesApi } from '@/lib/api';

export default function StudentCalendarPage() {
  const { data, error, loading, reload } = useAsync(() => classesApi.list(), []);
  const classes = data?.classes ?? [];

  return (
    <AppShell role="student" showBottomNav showTopBar topBarTitle="Calendar">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Calendar"
          description="View your class schedule and upcoming sessions"
        />

        {loading && (
          <div className="h-[28rem] bg-muted rounded-xl animate-pulse" aria-busy="true" aria-label="Loading calendar" />
        )}

        {!loading && error && (
          <EmptyState
            illustration="calendar"
            title="Could not load your calendar"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        )}

        {!loading && !error && classes.length === 0 && (
          <EmptyState
            illustration="calendar"
            title="No classes scheduled"
            description="Your classes will appear here once your teacher schedules them."
            action={<Button variant="outline" onClick={reload}>Refresh</Button>}
          />
        )}

        {!loading && !error && classes.length > 0 && (
          <Calendar classes={classes} mode="month" />
        )}
      </div>
    </AppShell>
  );
}
