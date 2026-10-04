'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAsync } from '@/lib/useAsync';
import { homeworkApi } from '@/lib/api';
import type { HomeworkSubmission, SubmissionStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock, Users, Paperclip, FileText, Send } from 'lucide-react';

const STATUS_CONFIG: Record<SubmissionStatus, { variant: 'warning' | 'secondary' | 'success'; label: string }> = {
  pending: { variant: 'warning', label: 'Not submitted' },
  submitted: { variant: 'secondary', label: 'Awaiting review' },
  reviewed: { variant: 'success', label: 'Reviewed' },
};

export default function TeacherHomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(async () => {
    const [homework, submissions] = await Promise.all([
      homeworkApi.get(id),
      homeworkApi.submissions(id),
    ]);
    return { homework: homework.homework, submissions: submissions.submissions };
  }, [id]);

  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const homework = data?.homework ?? null;
  const submissions = data?.submissions ?? [];
  const counts = homework?.submissionCounts;

  const handleReview = async (submission: HomeworkSubmission) => {
    const feedback = (feedbacks[submission.id] ?? submission.feedback ?? '').trim();
    if (!feedback) {
      toast({ title: 'Feedback required', description: 'Write some feedback before reviewing.', type: 'error' });
      return;
    }
    setReviewingId(submission.id);
    try {
      await homeworkApi.review(submission.id, feedback);
      toast({
        title: 'Review saved',
        description: `${submission.studentName ?? 'Student'}'s work has been marked as reviewed.`,
        type: 'success',
      });
      reload();
    } catch (err) {
      toast({
        title: 'Could not save review',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <AppShell role="teacher" showBottomNav={false} showTopBar topBarTitle="Homework">
        <div className="px-4 py-4 max-w-[720px] mx-auto space-y-4" aria-busy="true" aria-label="Loading submissions">
          <div className="h-9 w-2/3 bg-muted rounded-lg animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error || !homework) {
    return (
      <AppShell role="teacher" showBottomNav={false} showTopBar topBarTitle="Homework">
        <div className="px-4 py-4 max-w-[720px] mx-auto">
          <PageHeader title="Homework" backAction={() => router.back()} />
          <EmptyState
            illustration="homework"
            title={error ? 'Could not load assignment' : 'Assignment not found'}
            description={error ?? "This homework assignment doesn't exist or has been removed."}
            action={
              error ? (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={reload}>Try again</Button>
                  <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
              )
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="teacher" showBottomNav={false} showTopBar topBarTitle="Homework">
      <div className="px-4 py-4 max-w-[720px] mx-auto pb-24">
        <PageHeader
          title={homework.title}
          description={`Due ${formatDate(homework.dueDate)}`}
          backAction={() => router.back()}
        />

        <div className="mt-6 space-y-5">
          <Card variant="default" padding="lg" className="space-y-4">
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-foreground">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{homework.description}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(homework.assignedDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-9 h-9 rounded-lg bg-warning-light text-warning flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(homework.dueDate)}</p>
                </div>
              </div>
            </div>

            {counts && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" size="sm">{counts.total} students</Badge>
                <Badge variant="warning" size="sm">{counts.pending} not submitted</Badge>
                <Badge variant="secondary" size="sm">{counts.submitted} awaiting review</Badge>
                <Badge variant="success" size="sm">{counts.reviewed} reviewed</Badge>
              </div>
            )}

            {homework.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Reference material
                </h4>
                <div className="flex flex-wrap gap-2">
                  {homework.attachments.map(att => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs font-medium text-foreground hover:bg-muted/70 transition-smooth"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[180px]">{att.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <section aria-labelledby="submissions">
            <h3 id="submissions" className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Submissions
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {submissions.length}
              </span>
            </h3>

            {submissions.length === 0 ? (
              <EmptyState
                icon={<Users className="h-10 w-10 text-muted" />}
                title="No students assigned"
                description="This assignment doesn't have any students attached to it."
              />
            ) : (
              <div className="space-y-3">
                {submissions.map(sub => {
                  const { variant, label } = STATUS_CONFIG[sub.status];
                  const canReview = Boolean(sub.id) && sub.status !== 'pending';
                  const feedbackValue = feedbacks[sub.id] ?? sub.feedback ?? '';
                  return (
                    <Card key={`${sub.studentId}-${sub.id}`} variant="default" padding="md" className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={sub.studentName ?? 'Student'} size="md" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {sub.studentName ?? sub.studentId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {sub.submittedAt ? `Submitted ${formatDate(sub.submittedAt)}` : 'No submission yet'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={variant} size="sm">{label}</Badge>
                      </div>

                      {sub.note && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{sub.note}</p>
                      )}

                      {sub.files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {sub.files.map(file => (
                            <a
                              key={file.id}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs font-medium text-foreground hover:bg-muted/70 transition-smooth"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[180px]">{file.name}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {sub.status === 'reviewed' && sub.feedback && (
                        <div className="rounded-xl bg-success-light border border-success/30 p-4">
                          <p className="text-xs font-medium text-success uppercase tracking-wide mb-1">Feedback sent</p>
                          <p className="text-sm text-foreground leading-relaxed">{sub.feedback}</p>
                          {sub.reviewedAt && (
                            <p className="text-xs text-muted-foreground mt-2">{formatDate(sub.reviewedAt)}</p>
                          )}
                        </div>
                      )}

                      {canReview ? (
                        <div className="pt-3 border-t border-border space-y-3">
                          <Textarea
                            id={`review-${sub.id}`}
                            label={sub.status === 'reviewed' ? 'Update feedback' : 'Feedback'}
                            placeholder="Share what the student did well and what to improve…"
                            value={feedbackValue}
                            onChange={e => setFeedbacks(prev => ({ ...prev, [sub.id]: e.target.value }))}
                            rows={3}
                          />
                          <Button
                            type="button"
                            className="w-full"
                            isLoading={reviewingId === sub.id}
                            disabled={reviewingId !== null && reviewingId !== sub.id}
                            onClick={() => handleReview(sub)}
                          >
                            <Send className="h-4 w-4" />
                            {sub.status === 'reviewed' ? 'Update review' : 'Mark as reviewed'}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground pt-3 border-t border-border">
                          Waiting for the student to submit their work.
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
