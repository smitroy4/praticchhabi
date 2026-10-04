'use client';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { studentsApi } from '@/lib/api';
import { Plus, Calendar, BookOpen, MoreHorizontal, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminStudentsPage() {
  const { data, error, loading, reload } = useAsync(() => studentsApi.list(), []);
  const students = data?.students ?? [];

  return (
    <AppShell role="admin" showBottomNav showTopBar topBarTitle="Students">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Students"
          description="Manage student accounts and view progress"
          action={
            <Button asChild>
              <Link href="/admin/students/new">
                <Plus className="h-4 w-4" />
                Add Student
              </Link>
            </Button>
          }
        />

        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading students">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState
            title="Could not load students"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        )}

        {!loading && !error && students.length > 0 && (
          <div className="space-y-3">
            {students.map(student => (
              <Card key={student.id} variant="default" padding="md" className="flex items-center gap-4">
                <Avatar src={student.avatar} name={student.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-foreground truncate">{student.name}</h3>
                    <Badge variant="outline" size="sm">{student.studentId}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {student.classCount ?? 0} class{(student.classCount ?? 0) === 1 ? '' : 'es'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {student.homeworkCount ?? 0} assignment{(student.homeworkCount ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild aria-label={`View ${student.name}`}>
                  <Link href={`/admin/students/${student.id}`}>
                    <MoreHorizontal className="h-5 w-5" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && students.length === 0 && (
          <EmptyState
            icon={<Users className="h-10 w-10 text-muted" />}
            title="No students yet"
            description="Add your first student to get started."
            action={
              <Button asChild>
                <Link href="/admin/students/new">
                  <Plus className="h-4 w-4" />
                  Add Student
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
