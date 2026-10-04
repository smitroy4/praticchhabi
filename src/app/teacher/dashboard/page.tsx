'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnnouncementCard } from '@/components/student/AnnouncementCard';
import { ScheduleTimeline } from '@/components/student/ScheduleTimeline';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/useAsync';
import { announcementsApi, classesApi, homeworkApi, studentsApi } from '@/lib/api';
import { formatDateShort } from '@/lib/utils';
import {
  Calendar, ClipboardCheck, ClipboardList, Megaphone, Users, Plus, BookOpen, ChevronRight,
} from 'lucide-react';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(async () => {
    const [classes, homework, announcements, students] = await Promise.all([
      classesApi.list(),
      homeworkApi.list(),
      announcementsApi.list(),
      studentsApi.list(),
    ]);
    return {
      classes: classes.classes,
      homework: homework.homework,
      announcements: announcements.announcements,
      students: students.students,
    };
  }, []);

  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const todaysClasses = data?.classes.filter(c => c.date === today) ?? [];
  const upcomingClasses = data?.classes.filter(c => c.date > today).slice(0, 3) ?? [];
  const reviewQueue = data?.homework.filter(h => (h.submissionCounts?.submitted ?? 0) > 0) ?? [];
  const recentAnnouncements = data?.announcements.slice(0, 3) ?? [];
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <AppShell role="teacher" showBottomNav showTopBar topBarTitle="Dashboard">
      <div className="px-4 py-4 max-w-[720px] mx-auto space-y-6">
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${firstName}. Here's your teaching overview.`}
        />

        {loading && (
          <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-40 bg-muted rounded-xl animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <EmptyState
            title="Could not load your dashboard"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        )}

        {!loading && !error && data && (
          <>
            <section aria-labelledby="today-classes">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today&apos;s Classes
                </h2>
                <Link href="/teacher/calendar" className="text-sm text-primary hover:text-primary-hover font-medium">
                  View calendar
                </Link>
              </div>
              {todaysClasses.length > 0 ? (
                <ScheduleTimeline classes={todaysClasses} mode="today" />
              ) : (
                <Card variant="outlined" padding="md" className="text-center">
                  <Calendar className="mx-auto h-10 w-10 text-muted mb-3" />
                  <h3 className="text-base font-medium text-foreground mb-1">No classes today</h3>
                  <p className="text-sm text-muted-foreground">Enjoy your free day!</p>
                </Card>
              )}
            </section>

            {upcomingClasses.length > 0 && (
              <section aria-labelledby="upcoming-classes">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Classes
                  </h2>
                </div>
                <ScheduleTimeline classes={upcomingClasses} mode="upcoming" />
              </section>
            )}

            <section aria-labelledby="needs-review">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Needs Your Review
                  {reviewQueue.length > 0 && (
                    <Badge variant="warning" size="sm">{reviewQueue.length}</Badge>
                  )}
                </h2>
              </div>
              {reviewQueue.length > 0 ? (
                <div className="space-y-3">
                  {reviewQueue.map(hw => (
                    <Link key={hw.id} href={`/teacher/homework/${hw.id}`} className="block">
                      <Card variant="outlined" padding="md" className="pressable">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{hw.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Due {formatDateShort(hw.dueDate)}</p>
                          </div>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="warning" size="sm">
                              {hw.submissionCounts?.submitted ?? 0} to review
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card variant="outlined" padding="md" className="text-center">
                  <ClipboardCheck className="mx-auto h-10 w-10 text-muted mb-3" />
                  <h3 className="text-base font-medium text-foreground mb-1">Nothing to review</h3>
                  <p className="text-sm text-muted-foreground">Student submissions waiting for feedback will show up here.</p>
                </Card>
              )}
            </section>

            <section aria-labelledby="quick-stats">
              <h3 id="quick-stats" className="text-lg font-medium text-foreground mb-3">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card variant="outlined" padding="md" className="text-center">
                  <Users className="mx-auto h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-light text-foreground">{data.students.length}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </Card>
                <Card variant="outlined" padding="md" className="text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-secondary mb-2" />
                  <p className="text-2xl font-light text-foreground">{data.homework.length}</p>
                  <p className="text-xs text-muted-foreground">Assignments</p>
                </Card>
                <Card variant="outlined" padding="md" className="text-center">
                  <ClipboardList className="mx-auto h-8 w-8 text-warning mb-2" />
                  <p className="text-2xl font-light text-foreground">{data.classes.length}</p>
                  <p className="text-xs text-muted-foreground">Scheduled Classes</p>
                </Card>
                <Card variant="outlined" padding="md" className="text-center">
                  <Megaphone className="mx-auto h-8 w-8 text-error mb-2" />
                  <p className="text-2xl font-light text-foreground">{data.announcements.length}</p>
                  <p className="text-xs text-muted-foreground">Announcements</p>
                </Card>
              </div>
            </section>

            <section aria-labelledby="quick-actions">
              <h3 id="quick-actions" className="text-lg font-medium text-foreground mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center" asChild>
                  <Link href="/teacher/homework/create">
                    <Plus className="mx-auto h-6 w-6" />
                    <span>Create Homework</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center" asChild>
                  <Link href="/teacher/announcements/create">
                    <Megaphone className="mx-auto h-6 w-6" />
                    <span>Post Announcement</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center" asChild>
                  <Link href="/teacher/calendar/create">
                    <Calendar className="mx-auto h-6 w-6" />
                    <span>Schedule Class</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center" asChild>
                  <Link href="/teacher/students">
                    <Users className="mx-auto h-6 w-6" />
                    <span>View Students</span>
                  </Link>
                </Button>
              </div>
            </section>

            <section aria-labelledby="recent-announcements">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Recent Announcements
                </h2>
                <Link href="/teacher/announcements" className="text-sm text-primary hover:text-primary-hover font-medium">
                  View all
                </Link>
              </div>
              {recentAnnouncements.length > 0 ? (
                <div className="space-y-3">
                  {recentAnnouncements.map(ann => (
                    <AnnouncementCard
                      key={ann.id}
                      announcement={ann}
                      variant="compact"
                      onClick={() => router.push('/teacher/announcements')}
                    />
                  ))}
                </div>
              ) : (
                <Card variant="outlined" padding="md" className="text-center">
                  <Megaphone className="mx-auto h-10 w-10 text-muted mb-3" />
                  <h3 className="text-base font-medium text-foreground mb-1">No announcements yet</h3>
                  <p className="text-sm text-muted-foreground">Post an update to keep your students in the loop.</p>
                </Card>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
