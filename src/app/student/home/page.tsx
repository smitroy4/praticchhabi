'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ClassCard } from '@/components/student/ClassCard';
import { HomeworkCard } from '@/components/student/HomeworkCard';
import { AnnouncementCard } from '@/components/student/AnnouncementCard';
import { ScheduleTimeline } from '@/components/student/ScheduleTimeline';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/useAsync';
import { announcementsApi, classesApi, homeworkApi } from '@/lib/api';
import { Sun, Star, BookOpen, Megaphone, Calendar, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentHomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const classesRes = useAsync(() => classesApi.list(), []);
  const homeworkRes = useAsync(() => homeworkApi.list(), []);
  const announcementsRes = useAsync(() => announcementsApi.list(), []);

  const loading = classesRes.loading || homeworkRes.loading || announcementsRes.loading;
  const error = classesRes.error ?? homeworkRes.error ?? announcementsRes.error;
  const retry = () => {
    classesRes.reload();
    homeworkRes.reload();
    announcementsRes.reload();
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const classes = classesRes.data?.classes ?? [];
  const todaysClasses = classes.filter(c => c.date === todayKey);
  const upcomingClasses = classes
    .filter(c => new Date(`${c.date}T${c.startTime}`).getTime() >= now.getTime())
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())
    .slice(0, 3);

  const pendingHomework = (homeworkRes.data?.homework ?? [])
    .filter(hw => hw.status === 'pending' || hw.status === 'overdue')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const latestAnnouncement = (announcementsRes.data?.announcements ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

  return (
    <AppShell role="student" showBottomNav showTopBar topBarTitle="Home">
      <div className="px-4 py-4 space-y-6 max-w-[720px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting}, {user?.name?.split(' ')[0]}</p>
            <h1 className="text-2xl font-light tracking-tight text-foreground">Ready for your next drawing session?</h1>
          </div>
          <Avatar src={user?.avatar} name={user?.name} size="lg" />
        </div>

        {loading && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading your dashboard">
            <div className="h-44 bg-muted rounded-xl animate-pulse" />
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
            <div className="h-28 bg-muted rounded-xl animate-pulse" />
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <EmptyState
            illustration="classes"
            title="Could not load your dashboard"
            description={error}
            action={<Button variant="outline" onClick={retry}>Try again</Button>}
          />
        )}

        {!loading && !error && (
          <>
            {upcomingClasses.length > 0 ? (
              <ClassCard class={upcomingClasses[0]} variant="next" />
            ) : (
              <Card variant="default" padding="lg" className="text-center">
                <Star className="mx-auto h-12 w-12 text-muted mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No upcoming classes</h3>
                <p className="text-sm text-muted-foreground">Your schedule is clear. Enjoy your free time!</p>
              </Card>
            )}

            <section aria-labelledby="today-schedule">
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
                  <Sun className="mx-auto h-10 w-10 text-muted mb-3" />
                  <p className="text-sm text-muted-foreground">No classes today. Enjoy your day!</p>
                </Card>
              )}
            </section>

            <section aria-labelledby="homework-section">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Homework
                  {pendingHomework.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {pendingHomework.length} pending
                    </span>
                  )}
                </h2>
              </div>
              {pendingHomework.length > 0 ? (
                <div className="space-y-3">
                  {pendingHomework.slice(0, 3).map(hw => (
                    <HomeworkCard key={hw.id} homework={hw} variant="default" onClick={() => router.push(`/student/homework/${hw.id}`)} />
                  ))}
                  {pendingHomework.length > 3 && (
                    <Card variant="outlined" padding="sm" className="text-center">
                      <button
                        onClick={() => router.push('/student/homework')}
                        className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1 mx-auto"
                      >
                        <BookOpen className="h-4 w-4" />
                        View all {pendingHomework.length} assignments
                      </button>
                    </Card>
                  )}
                </div>
              ) : (
                <Card variant="outlined" padding="md" className="text-center">
                  <CheckCircle className="mx-auto h-10 w-10 text-success mb-3" />
                  <h3 className="text-base font-medium text-foreground mb-1">You&apos;re all caught up!</h3>
                  <p className="text-sm text-muted-foreground">No pending homework assignments.</p>
                </Card>
              )}
            </section>

            <section aria-labelledby="announcements-section">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Latest Announcement
                </h2>
              </div>
              {latestAnnouncement ? (
                <AnnouncementCard announcement={latestAnnouncement} variant="feed" onClick={() => router.push(`/student/announcements/${latestAnnouncement.id}`)} />
              ) : (
                <Card variant="outlined" padding="md" className="text-center">
                  <Megaphone className="mx-auto h-10 w-10 text-muted mb-3" />
                  <p className="text-sm text-muted-foreground">No new announcements.</p>
                </Card>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
