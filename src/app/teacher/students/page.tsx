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
import { Calendar, BookOpen, Mail, Users } from 'lucide-react';

export default function TeacherStudentsPage() {
  const { data, loading, error, reload } = useAsync(() => studentsApi.list(), []);
  const students = data?.students ?? [];

  return (
    <AppShell role="teacher" showBottomNav={true} showTopBar topBarTitle="Students">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Students"
          description="View your students' progress and activity"
        />

        <div className="space-y-3 mt-4">
          {loading && (
            <div aria-busy="true" aria-label="Loading students" className="space-y-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
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

          {!loading && !error && students.length === 0 && (
            <EmptyState
              icon={<Users className="h-10 w-10 text-muted" />}
              title="No students yet"
              description="Students enrolled in your classes will show up here."
            />
          )}

          {!loading && !error && students.map(student => (
            <Card key={student.id} variant="default" padding="md">
              <div className="flex items-start gap-4">
                <Avatar src={student.avatar} name={student.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-foreground">{student.name}</h3>
                    {student.studentId && <Badge variant="outline" size="sm">{student.studentId}</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {student.classCount ?? 0} class{(student.classCount ?? 0) === 1 ? '' : 'es'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {student.homeworkCount ?? 0} assignment{(student.homeworkCount ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
