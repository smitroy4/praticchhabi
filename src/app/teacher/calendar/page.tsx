'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar } from '@/components/student/Calendar';
import { useAsync } from '@/lib/useAsync';
import { classesApi } from '@/lib/api';
import { Plus } from 'lucide-react';

export default function TeacherCalendarPage() {
  const { data, loading, error, reload } = useAsync(() => classesApi.list(), []);
  const classes = data?.classes ?? [];

  return (
    <AppShell role="teacher" showBottomNav showTopBar topBarTitle="Calendar">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Calendar"
          description="Manage your class schedule and sessions"
          action={
            <Button asChild>
              <Link href="/teacher/calendar/create">
                <Plus className="h-4 w-4" />
                Schedule Class
              </Link>
            </Button>
          }
        />

        <div className="mt-6">
          {loading && (
            <div className="space-y-3" aria-busy="true" aria-label="Loading calendar">
              <div className="h-10 w-1/2 bg-muted rounded-lg animate-pulse" />
              <div className="h-80 bg-muted rounded-xl animate-pulse" />
            </div>
          )}

          {!loading && error && (
            <EmptyState
              title="Could not load your calendar"
              description={error}
              action={<Button variant="outline" onClick={reload}>Try again</Button>}
            />
          )}

          {!loading && !error && (
            <>
              <Calendar classes={classes} mode="month" />
              {classes.length === 0 && (
                <EmptyState
                  illustration="calendar"
                  title="No classes scheduled"
                  description="Schedule your first class to start filling up your calendar."
                  action={
                    <Button asChild>
                      <Link href="/teacher/calendar/create">
                        <Plus className="h-4 w-4" />
                        Schedule Class
                      </Link>
                    </Button>
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
