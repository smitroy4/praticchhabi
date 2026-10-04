'use client';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/useAsync';
import { studentsApi } from '@/lib/api';
import { Calendar, BookOpen, CheckCircle, Clock, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function StudentProfilePage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const userId = user?.id;

  const { data, error, loading, reload } = useAsync(
    () => (userId ? studentsApi.get(userId) : Promise.resolve(null)),
    [userId]
  );

  const waiting = authLoading || loading || (!error && data === null);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Signed out', description: 'You have been signed out.', type: 'success' });
    } catch (err) {
      toast({
        title: 'Could not sign out',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    }
  };

  return (
    <AppShell role="student" showBottomNav showTopBar topBarTitle="Profile">
      <div className="px-4 py-4 max-w-[720px] mx-auto space-y-6">
        <PageHeader title="Profile" description="Manage your account and preferences" />

        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar} name={user?.name} size="xl" />
            <div className="flex-1">
              <h2 className="text-xl font-medium text-foreground">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="primary" size="sm">Student</Badge>
                <Badge variant="outline" size="sm">ID: {user?.studentId}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <section aria-labelledby="stats">
          <h3 id="stats" className="text-lg font-medium text-foreground mb-3">Overview</h3>

          {waiting && (
            <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading overview">
              {[0, 1, 2, 3].map(i => (
                <Skeleton key={i} variant="rectangular" className="h-24" />
              ))}
            </div>
          )}

          {!waiting && error && (
            <EmptyState
              illustration="homework"
              title="Could not load your overview"
              description={error}
              action={<Button variant="outline" onClick={reload}>Try again</Button>}
            />
          )}

          {!waiting && !error && data && (
            <div className="grid grid-cols-2 gap-3">
              <Card variant="outlined" padding="md" className="text-center">
                <Calendar className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-light text-foreground">{data.classCount}</p>
                <p className="text-xs text-muted-foreground">Enrolled Classes</p>
              </Card>
              <Card variant="outlined" padding="md" className="text-center">
                <BookOpen className="mx-auto h-8 w-8 text-secondary mb-2" />
                <p className="text-2xl font-light text-foreground">{data.homeworkCount}</p>
                <p className="text-xs text-muted-foreground">Total Assignments</p>
              </Card>
              <Card variant="outlined" padding="md" className="text-center">
                <Clock className="mx-auto h-8 w-8 text-warning mb-2" />
                <p className="text-2xl font-light text-foreground">{data.pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </Card>
              <Card variant="outlined" padding="md" className="text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-success mb-2" />
                <p className="text-2xl font-light text-foreground">{data.submittedCount}</p>
                <p className="text-xs text-muted-foreground">Submitted</p>
              </Card>
            </div>
          )}
        </section>

        <section aria-labelledby="account">
          <h3 id="account" className="text-lg font-medium text-foreground mb-3">Account</h3>
          <Card variant="default" padding="none">
            <Link href="/student/notifications" className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-smooth">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground">View class reminders and updates</p>
              </div>
            </Link>
          </Card>
        </section>

        <Button variant="ghost" className="w-full text-error hover:bg-error-light" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </AppShell>
  );
}
