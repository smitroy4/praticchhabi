'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { HomeworkCard } from '@/components/student/HomeworkCard';
import { ClassCard } from '@/components/student/ClassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { classesApi, homeworkApi, studentsApi } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import type { ClassSession, Homework } from '@/types';
import {
  Calendar, BookOpen, CheckCircle, Clock, Mail, Hash,
  TrendingUp, Activity,
} from 'lucide-react';

interface StudentDetailData {
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    studentId?: string;
  };
  classCount: number;
  homeworkCount: number;
  pendingCount: number;
  submittedCount: number;
  activity: {
    id: string;
    title: string;
    status: string;
    submittedAt: Date | null;
    reviewedAt: Date | null;
  }[];
  classes: ClassSession[];
  homework: Homework[];
}

export default function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, error, loading, reload } = useAsync<StudentDetailData>(
    () =>
      Promise.all([studentsApi.get(id), classesApi.list(), homeworkApi.list()]).then(
        ([detail, classes, homework]) => ({
          student: detail.student,
          classCount: detail.classCount,
          homeworkCount: detail.homeworkCount,
          pendingCount: detail.pendingCount,
          submittedCount: detail.submittedCount,
          activity: detail.activity,
          classes: classes.classes.filter(c => c.studentIds.includes(id)),
          homework: homework.homework.filter(h => h.studentIds.includes(id)),
        })
      ),
    [id]
  );

  if (loading) {
    return (
      <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="Student Profile">
        <div className="px-4 py-4 max-w-[720px] mx-auto space-y-4" aria-busy="true" aria-label="Loading student">
          <div className="h-9 w-2/3 bg-muted rounded-lg animate-pulse" />
          <div className="h-28 bg-muted rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="Student Profile">
        <div className="px-4 py-4 max-w-[720px] mx-auto">
          <PageHeader title="Student" backAction={() => router.back()} />
          <EmptyState
            title="Could not load student"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="Student">
        <div className="px-4 py-4 max-w-[720px] mx-auto">
          <PageHeader title="Student" backAction={() => router.back()} />
          <EmptyState
            illustration="search"
            title="Student not found"
            description="This student profile doesn't exist."
            action={<Button variant="outline" onClick={() => router.back()}>Go Back</Button>}
          />
        </div>
      </AppShell>
    );
  }

  const { student, classCount, homeworkCount, pendingCount, submittedCount, activity, classes, homework } = data;
  const completedCount = Math.max(0, homeworkCount - pendingCount);
  const completionRate = homeworkCount > 0 ? Math.min(100, Math.round((completedCount / homeworkCount) * 100)) : 0;

  return (
    <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="Student Profile">
      <div className="px-4 py-4 max-w-[720px] mx-auto space-y-6">
        <PageHeader
          title={student.name}
          backAction={() => router.back()}
          action={<Badge variant="primary" size="md">{student.studentId}</Badge>}
        />

        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-4">
            <Avatar src={student.avatar} name={student.name} size="xl" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-medium text-foreground">{student.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                {student.email}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <Hash className="h-4 w-4" />
                {student.studentId}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Calendar} value={classCount} label="Classes" tone="primary" />
          <StatCard icon={BookOpen} value={homeworkCount} label="Assignments" tone="secondary" />
          <StatCard icon={Clock} value={pendingCount} label="Pending" tone="warning" />
          <StatCard icon={CheckCircle} value={submittedCount} label="Submitted" tone="success" />
        </div>

        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Homework completion</p>
            </div>
            <p className="text-lg font-medium text-foreground">{completionRate}%</p>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={completionRate} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </Card>

        <section aria-labelledby="student-classes">
          <h3 id="student-classes" className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Classes
          </h3>
          {classes.length > 0 ? (
            <div className="space-y-3">
              {classes.slice(0, 3).map(c => (
                <ClassCard key={c.id} class={c} variant="compact" />
              ))}
            </div>
          ) : (
            <Card variant="outlined" padding="md" className="text-center">
              <p className="text-sm text-muted-foreground">No classes enrolled.</p>
            </Card>
          )}
        </section>

        <section aria-labelledby="student-homework">
          <div className="flex items-center justify-between mb-3">
            <h3 id="student-homework" className="text-base font-medium text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Homework
            </h3>
            <Badge variant="outline" size="sm">{homework.length} total</Badge>
          </div>
          {homework.length > 0 ? (
            <div className="space-y-3">
              {homework.map(hw => (
                <HomeworkCard key={hw.id} homework={hw} variant="compact" />
              ))}
            </div>
          ) : (
            <Card variant="outlined" padding="md" className="text-center">
              <p className="text-sm text-muted-foreground">No homework assigned yet.</p>
            </Card>
          )}
        </section>

        <section aria-labelledby="recent-activity-student">
          <h3 id="recent-activity-student" className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </h3>
          {activity.length > 0 ? (
            <Card variant="default" padding="none">
              {activity.map((item, index) => {
                const reviewed = item.status === 'reviewed';
                const when = item.reviewedAt ?? item.submittedAt;
                return (
                  <ActivityRow
                    key={item.id}
                    icon={reviewed ? CheckCircle : BookOpen}
                    iconClass={reviewed ? 'bg-success-light text-success' : 'bg-primary-light text-primary'}
                    title={`${reviewed ? 'Reviewed' : 'Submitted'} '${item.title}'`}
                    time={when ? formatDate(when) : item.status}
                    border={index > 0}
                  />
                );
              })}
            </Card>
          ) : (
            <Card variant="outlined" padding="md" className="text-center">
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}

const toneMap = {
  primary: 'bg-primary-light text-primary',
  secondary: 'bg-secondary-light text-secondary',
  warning: 'bg-warning-light text-warning',
  success: 'bg-success-light text-success',
};

function StatCard({ icon: Icon, value, label, tone }: {
  icon: React.ElementType; value: number; label: string;
  tone: keyof typeof toneMap;
}) {
  return (
    <Card variant="outlined" padding="md" className="text-center">
      <div className={cn('w-8 h-8 rounded-lg mx-auto flex items-center justify-center mb-2', toneMap[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-light text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function ActivityRow({ icon: Icon, iconClass, title, time, border }: {
  icon: React.ElementType; iconClass: string; title: string; time: string; border?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', border && 'border-t border-border')}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
