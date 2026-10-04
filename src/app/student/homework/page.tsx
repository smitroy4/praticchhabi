'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { HomeworkCard } from '@/components/student/HomeworkCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useAsync } from '@/lib/useAsync';
import { homeworkApi } from '@/lib/api';
import { BookOpen, CheckCircle, Clock, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Tab = 'pending' | 'completed' | 'reviewed' | 'all';

const EMPTY_COPY: Record<Tab, { title: string; description: string }> = {
  pending: { title: "You're all caught up!", description: 'No pending homework assignments. Great job!' },
  completed: { title: 'No completed assignments yet', description: 'Complete your homework to see it here.' },
  reviewed: { title: 'Nothing reviewed yet', description: "Assignments your teacher has reviewed will appear here." },
  all: { title: 'No assignments yet', description: 'Your homework will appear here when assigned.' },
};

export default function StudentHomeworkPage() {
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(() => homeworkApi.list(), []);
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  const all = data?.homework ?? [];
  const pending = all.filter(hw => hw.status === 'pending' || hw.status === 'overdue');
  const completed = all.filter(hw => hw.status === 'submitted' || hw.status === 'completed');
  const reviewed = all.filter(hw => hw.status === 'reviewed');

  const renderList = (items: typeof all, tab: Tab) =>
    items.length > 0 ? (
      <div className="space-y-3">
        {items.map(hw => (
          <HomeworkCard key={hw.id} homework={hw} variant="default" onClick={() => router.push(`/student/homework/${hw.id}`)} />
        ))}
      </div>
    ) : (
      <EmptyState
        illustration="homework"
        title={EMPTY_COPY[tab].title}
        description={EMPTY_COPY[tab].description}
      />
    );

  return (
    <AppShell role="student" showBottomNav showTopBar topBarTitle="Homework">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Homework"
          description="Track your assignments and practice materials"
        />

        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading homework">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState
            illustration="homework"
            title="Could not load your homework"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        )}

        {!loading && !error && (
          <Tabs defaultValue="pending" value={activeTab} onValueChange={v => setActiveTab(v as Tab)}>
            <TabsList role="tablist" aria-label="Homework status">
              <TabsTrigger value="pending" className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Pending {pending.length > 0 && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs">{pending.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Completed {completed.length > 0 && <span className="bg-success/10 text-success px-1.5 py-0.5 rounded-full text-xs">{completed.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="reviewed" className="flex items-center gap-1.5">
                <Star className="h-4 w-4" />
                Reviewed {reviewed.length > 0 && <span className="bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full text-xs">{reviewed.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                All {all.length > 0 && <span className="bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded-full text-xs">{all.length}</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">{renderList(pending, 'pending')}</TabsContent>
            <TabsContent value="completed">{renderList(completed, 'completed')}</TabsContent>
            <TabsContent value="reviewed">{renderList(reviewed, 'reviewed')}</TabsContent>
            <TabsContent value="all">{renderList(all, 'all')}</TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
