'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { HomeworkCard } from '@/components/student/HomeworkCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useAsync } from '@/lib/useAsync';
import { homeworkApi } from '@/lib/api';
import type { Homework } from '@/types';
import { Plus, BookOpen, Clock, CheckCircle, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminHomeworkPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const { data, error, loading, reload } = useAsync(() => homeworkApi.list(), []);

  const allHomework = data?.homework ?? [];
  const isCompleted = (hw: Homework) =>
    hw.submissionCounts
      ? hw.submissionCounts.total > 0 && hw.submissionCounts.pending === 0
      : hw.status === 'completed' || hw.status === 'submitted';
  const isPending = (hw: Homework) =>
    !isCompleted(hw) && (hw.status === 'pending' || hw.status === 'overdue' || (hw.submissionCounts?.pending ?? 0) > 0);

  const pendingHomework = allHomework.filter(isPending);
  const completedHomework = allHomework.filter(isCompleted);

  const getHomeworkForTab = (tab: typeof activeTab) => {
    switch (tab) {
      case 'pending': return pendingHomework;
      case 'completed': return completedHomework;
      default: return allHomework;
    }
  };

  const currentHomework = getHomeworkForTab(activeTab);

  const renderList = (items: Homework[], emptyNode: React.ReactNode) =>
    loading ? (
      <div className="space-y-3" aria-busy="true" aria-label="Loading homework">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    ) : error ? (
      <EmptyState
        title="Could not load homework"
        description={error}
        action={<Button variant="outline" onClick={reload}>Try again</Button>}
      />
    ) : items.length > 0 ? (
      <div className="space-y-3">
        {items.map(hw => (
          <div key={hw.id} className="space-y-2">
            <HomeworkCard homework={hw} variant="default" showActions={false} />
            {hw.submissionCounts && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                <Badge variant="secondary" size="sm">
                  <Users className="h-3 w-3" />
                  {hw.submissionCounts.submitted + hw.submissionCounts.reviewed}/{hw.submissionCounts.total} submitted
                </Badge>
                <Badge variant={hw.submissionCounts.pending > 0 ? 'warning' : 'success'} size="sm">
                  {hw.submissionCounts.pending > 0 ? `${hw.submissionCounts.pending} pending` : 'All submitted'}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      emptyNode
    );

  return (
    <AppShell role="admin" showBottomNav showTopBar topBarTitle="Homework">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Homework"
          description="Manage all assignments"
          action={
            <Button asChild>
              <Link href="/admin/homework/create">
                <Plus className="h-4 w-4" />
                Add Homework
              </Link>
            </Button>
          }
        />

        <Tabs defaultValue="all" value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
          <TabsList role="tablist" aria-label="Homework status">
            <TabsTrigger value="all" className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              All {allHomework.length > 0 && <span className="bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded-full text-xs">{allHomework.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Pending {pendingHomework.length > 0 && <span className="bg-warning/10 text-warning px-1.5 py-0.5 rounded-full text-xs">{pendingHomework.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Completed {completedHomework.length > 0 && <span className="bg-success/10 text-success px-1.5 py-0.5 rounded-full text-xs">{completedHomework.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderList(
              currentHomework,
              <EmptyState
                illustration="homework"
                title="No homework yet"
                description="Create assignments for students."
                action={
                  <Button asChild>
                    <Link href="/admin/homework/create">
                      <Plus className="h-4 w-4" />
                      Add Homework
                    </Link>
                  </Button>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="pending">
            {renderList(
              currentHomework,
              <EmptyState
                icon={<Clock className="h-10 w-10 text-muted" />}
                title="No pending homework"
                description="All assignments are up to date."
              />
            )}
          </TabsContent>

          <TabsContent value="completed">
            {renderList(
              currentHomework,
              <EmptyState
                icon={<CheckCircle className="h-10 w-10 text-muted" />}
                title="No completed homework"
                description="Completed assignments will appear here."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
