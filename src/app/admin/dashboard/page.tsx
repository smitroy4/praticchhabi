'use client';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScheduleTimeline } from '@/components/student/ScheduleTimeline';
import { useAsync } from '@/lib/useAsync';
import { announcementsApi, classesApi, homeworkApi, studentsApi } from '@/lib/api';
import { isToday, formatDateShort } from '@/lib/utils';
import type { Announcement, ClassSession, Homework } from '@/types';
import { Users, Calendar, BookOpen, Megaphone, Plus, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  classes: ClassSession[];
  homework: Homework[];
  announcements: Announcement[];
  studentCount: number;
}

export default function AdminDashboardPage() {
  const { data, error, loading, reload } = useAsync<DashboardData>(
    () =>
      Promise.all([
        classesApi.list(),
        homeworkApi.list(),
        announcementsApi.list(),
        studentsApi.list(),
      ]).then(([classes, homework, announcements, students]) => ({
        classes: classes.classes,
        homework: homework.homework,
        announcements: announcements.announcements,
        studentCount: students.students.length,
      })),
    []
  );

  const classes = data?.classes ?? [];
  const homework = data?.homework ?? [];
  const announcements = data?.announcements ?? [];

  const upcomingClasses = classes.filter(c => new Date(`${c.date}T${c.endTime}`) > new Date()).length;
  const pendingHomework = homework.filter(h => h.status === 'pending' || h.status === 'overdue').length;
  const todaysClasses = classes.filter(c => isToday(c.date));
  const recentActivity = announcements.slice(0, 3);

  return (
    <AppShell role="admin" showBottomNav showTopBar topBarTitle="Dashboard">
      <div className="px-4 py-4 max-w-[720px] mx-auto space-y-6">
        <PageHeader
          title="Dashboard"
          description="School overview and quick actions"
        />

        {loading && (
          <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-40 bg-muted rounded-xl animate-pulse" />
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <EmptyState
            title="Could not load dashboard"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        )}

        {!loading && !error && data && (
          <>
            <section aria-labelledby="overview">
              <h3 id="overview" className="text-lg font-medium text-foreground mb-3">Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card variant="elevated" padding="md" className="text-center">
                  <Users className="mx-auto h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-light text-foreground">{data.studentCount}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </Card>
                <Card variant="elevated" padding="md" className="text-center">
                  <Calendar className="mx-auto h-8 w-8 text-secondary mb-2" />
                  <p className="text-2xl font-light text-foreground">{upcomingClasses}</p>
                  <p className="text-xs text-muted-foreground">Upcoming Classes</p>
                </Card>
                <Card variant="elevated" padding="md" className="text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-warning mb-2" />
                  <p className="text-2xl font-light text-foreground">{pendingHomework}</p>
                  <p className="text-xs text-muted-foreground">Pending Homework</p>
                </Card>
                <Card variant="elevated" padding="md" className="text-center">
                  <Megaphone className="mx-auto h-8 w-8 text-error mb-2" />
                  <p className="text-2xl font-light text-foreground">{announcements.length}</p>
                  <p className="text-xs text-muted-foreground">Announcements</p>
                </Card>
              </div>
            </section>

            <section aria-labelledby="quick-actions">
              <h3 id="quick-actions" className="text-lg font-medium text-foreground mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction href="/admin/students/new" icon={Plus} label="Add Student" />
                <QuickAction href="/admin/announcements/create" icon={Megaphone} label="Create Announcement" />
                <QuickAction href="/admin/homework/create" icon={BookOpen} label="Add Homework" />
                <QuickAction href="/admin/calendar/create" icon={Calendar} label="Schedule Class" />
              </div>
            </section>

            <section aria-labelledby="upcoming-schedule">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today&apos;s Schedule
                </h2>
              </div>
              {todaysClasses.length > 0 ? (
                <ScheduleTimeline classes={todaysClasses} mode="today" />
              ) : (
                <Card variant="outlined" padding="md" className="text-center">
                  <Calendar className="mx-auto h-10 w-10 text-muted mb-3" />
                  <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
                </Card>
              )}
            </section>

            <section aria-labelledby="recent-activity">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </h2>
              </div>
              {recentActivity.length > 0 ? (
                <Card variant="default" padding="none">
                  <div className="space-y-0">
                    {recentActivity.map((ann, index) => (
                      <div
                        key={ann.id}
                        className={`flex items-center gap-3 px-4 py-3 ${index < recentActivity.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ann.title}</p>
                          <p className="text-xs text-muted-foreground">{ann.authorName} · {formatDateShort(ann.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card variant="outlined" padding="md" className="text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-muted mb-3" />
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                </Card>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="h-24 flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface hover:border-primary/50 hover:bg-primary-light text-foreground transition-smooth pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Icon className="h-6 w-6 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
