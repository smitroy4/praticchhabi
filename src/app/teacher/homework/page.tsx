'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useAsync } from '@/lib/useAsync';
import { homeworkApi } from '@/lib/api';
import type { Homework } from '@/types';
import { formatDateShort, isOverdue } from '@/lib/utils';
import { Plus, Clock, CheckCircle, BookOpen, ChevronRight } from 'lucide-react';

const isComplete = (hw: Homework) =>
  Boolean(hw.submissionCounts && hw.submissionCounts.total > 0 && hw.submissionCounts.reviewed === hw.submissionCounts.total);

const needsReview = (hw: Homework) => (hw.submissionCounts?.submitted ?? 0) > 0;

function statusOf(hw: Homework) {
  if (isComplete(hw)) return { variant: 'success' as const, label: 'Reviewed' };
  if (isOverdue(hw.dueDate)) return { variant: 'error' as const, label: 'Overdue' };
  if (needsReview(hw)) return { variant: 'warning' as const, label: 'To review' };
  return { variant: 'secondary' as const, label: 'Assigned' };
}

export default function TeacherHomeworkPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const { data, loading, error, reload } = useAsync(() => homeworkApi.list(), []);

  const allHomework = data?.homework ?? [];
  const pendingHomework = allHomework.filter(hw => !isComplete(hw));
  const completedHomework = allHomework.filter(isComplete);

  const emptyContent = {
    all: {
      icon: <BookOpen className="mx-auto h-12 w-12 text-muted mb-4" />,
      title: 'No homework assigned yet',
      description: 'Create your first assignment for students.',
      action: (
        <Button asChild>
          <Link href="/teacher/homework/create">
            <Plus className="h-4 w-4" />
            Create Homework
          </Link>
        </Button>
      ),
    },
    pending: {
      icon: <Clock className="mx-auto h-12 w-12 text-warning mb-4" />,
      title: 'No pending homework',
      description: 'Every assignment has been fully reviewed.',
      action: undefined,
    },
    completed: {
      icon: <CheckCircle className="mx-auto h-12 w-12 text-success mb-4" />,
      title: 'No completed homework',
      description: 'Assignments with all submissions reviewed will appear here.',
      action: undefined,
    },
  };

  return (
    <AppShell role="teacher" showBottomNav showTopBar topBarTitle="Homework">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Homework"
          description="Manage assignments for your students"
          action={
            <Button asChild>
              <Link href="/teacher/homework/create">
                <Plus className="h-4 w-4" />
                Create Homework
              </Link>
            </Button>
          }
        />

        {loading && (
          <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading homework">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-6">
            <EmptyState
              title="Could not load homework"
              description={error}
              action={<Button variant="outline" onClick={reload}>Try again</Button>}
            />
          </div>
        )}

        {!loading && !error && (
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

            {(['all', 'pending', 'completed'] as const).map(tab => {
              const items = tab === 'all' ? allHomework : tab === 'pending' ? pendingHomework : completedHomework;
              return (
                <TabsContent key={tab} value={tab}>
                  {items.length > 0 ? (
                    <div className="space-y-3">
                      {items.map(hw => {
                        const status = statusOf(hw);
                        const counts = hw.submissionCounts;
                        return (
                          <Link key={hw.id} href={`/teacher/homework/${hw.id}`} className="block">
                            <Card variant="default" padding="md" className="pressable">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base font-medium text-foreground truncate">{hw.title}</h3>
                                    <Badge variant={status.variant} size="sm">{status.label}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{hw.description}</p>
                                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Due {formatDateShort(hw.dueDate)}
                                  </span>
                                  {counts && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      <Badge variant="outline" size="sm">{counts.total} students</Badge>
                                      <Badge variant="warning" size="sm">{counts.pending} waiting</Badge>
                                      <Badge variant="secondary" size="sm">{counts.submitted} to review</Badge>
                                      <Badge variant="success" size="sm">{counts.reviewed} reviewed</Badge>
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={emptyContent[tab].icon}
                      title={emptyContent[tab].title}
                      description={emptyContent[tab].description}
                      action={emptyContent[tab].action}
                    />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
