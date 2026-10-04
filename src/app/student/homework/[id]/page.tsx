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
import { FileUpload, UploadedFile } from '@/components/ui/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { homeworkApi, uploadsApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import type { HomeworkStatus } from '@/types';
import {
  Clock, Calendar, FileText, Image as ImageIcon, Video,
  CheckCircle, AlertTriangle, Eye, Paperclip, BookOpen, Send, Star,
} from 'lucide-react';

const FILE_ICONS = { image: ImageIcon, pdf: FileText, video: Video, file: FileText } as const;

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const STATUS_CONFIG: Record<HomeworkStatus, { variant: 'warning' | 'secondary' | 'success' | 'error'; label: string; icon: typeof Clock }> = {
  pending: { variant: 'warning', label: 'Pending', icon: Clock },
  submitted: { variant: 'secondary', label: 'Submitted', icon: CheckCircle },
  completed: { variant: 'success', label: 'Completed', icon: CheckCircle },
  reviewed: { variant: 'success', label: 'Reviewed', icon: Star },
  overdue: { variant: 'error', label: 'Overdue', icon: AlertTriangle },
};

export default function StudentHomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(() => homeworkApi.get(id), [id]);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const homework = data?.homework ?? null;
  const submission = homework?.submission ?? null;
  const status = homework?.status ?? 'pending';
  const { variant, label, icon: StatusIcon } = STATUS_CONFIG[status];
  const overdue = status === 'overdue';
  const canSubmit = homework ? status === 'pending' || status === 'overdue' : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homework) return;
    const pending = files.filter(f => !f.error);
    if (!pending.length) {
      toast({ title: 'Add your work', description: 'Attach at least one file before submitting.', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = await uploadsApi.upload(pending.map(f => f.file));
      await homeworkApi.submit(homework.id, uploaded, note.trim() || undefined);
      toast({
        title: 'Homework submitted',
        description: `"${homework.title}" has been sent to your teacher.`,
        type: 'success',
      });
      setFiles([]);
      setNote('');
      reload();
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="student" showBottomNav={false} showTopBar topBarTitle="Homework">
        <div className="px-4 py-4 max-w-[720px] mx-auto space-y-4" aria-busy="true" aria-label="Loading homework">
          <div className="h-9 w-2/3 bg-muted rounded-lg animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error || !homework) {
    return (
      <AppShell role="student" showBottomNav={false} showTopBar topBarTitle="Homework">
        <div className="px-4 py-4 max-w-[720px] mx-auto">
          <PageHeader title="Homework" backAction={() => router.back()} />
          <EmptyState
            illustration="homework"
            title={error ? 'Could not load assignment' : 'Assignment not found'}
            description={error ?? "This homework assignment doesn't exist or has been removed."}
            action={<Button variant="outline" onClick={() => router.back()}>Go Back</Button>}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="student" showBottomNav={false} showTopBar topBarTitle="Homework">
      <div className="px-4 py-4 max-w-[720px] mx-auto pb-24">
        <PageHeader
          title={homework.title}
          backAction={() => router.back()}
          action={<Badge variant={variant} size="md"><StatusIcon className="h-4 w-4" />{label}</Badge>}
        />

        <div className="mt-6 space-y-5">
          <Card variant="default" padding="lg">
            <div className="flex items-start gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-foreground">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{homework.description}</p>
              </div>
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 gap-3">
            <Card variant="outlined" padding="md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(homework.assignedDate)}</p>
                </div>
              </div>
            </Card>
            <Card variant="outlined" padding="md">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', overdue ? 'bg-error-light text-error' : 'bg-warning-light text-warning')}>
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className={cn('text-sm font-medium', overdue ? 'text-error' : 'text-foreground')}>
                    {formatDate(homework.dueDate)}
                    {overdue && <span className="block text-xs font-normal">Overdue</span>}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card variant="outlined" padding="md">
            <div className="flex items-center gap-3">
              <Avatar name={homework.teacherName ?? 'Teacher'} size="md" />
              <div>
                <p className="text-xs text-muted-foreground">Assigned by</p>
                <p className="text-sm font-medium text-foreground">{homework.teacherName ?? 'Teacher'}</p>
                <p className="text-xs text-muted-foreground">Drawing Teacher</p>
              </div>
            </div>
          </Card>

          {homework.attachments.length > 0 && (
            <section aria-labelledby="reference-material">
              <h3 id="reference-material" className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Reference Material
              </h3>
              <div className="space-y-3">
                {homework.attachments.map(att => {
                  const Icon = FILE_ICONS[att.type] || FileText;
                  if (att.type === 'image') {
                    return (
                      <div key={att.id} className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted group">
                        <button
                          onClick={() => setImagePreview(att.url)}
                          className="w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={`Preview ${att.name}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-between">
                          <span className="text-xs text-white truncate">{att.name}</span>
                          <span className="text-xs text-white/70">{formatBytes(att.size)}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <Card key={att.id} variant="outlined" padding="md" className="flex items-center gap-3">
                      <div className={cn(
                        'w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0',
                        att.type === 'pdf' ? 'bg-error-light text-error' : 'bg-secondary-light text-secondary'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                        <p className="text-xs text-muted-foreground">{att.type.toUpperCase()} · {formatBytes(att.size)}</p>
                      </div>
                      <Button variant="outline" size="sm" aria-label={`View ${att.name}`} asChild>
                        <a href={att.url} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4" />
                          View
                        </a>
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {submission && (
            <section aria-labelledby="your-work">
              <h3 id="your-work" className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Your submission
              </h3>
              <Card variant="default" padding="lg" className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={submission.status === 'reviewed' ? 'success' : 'secondary'} size="sm">
                    {submission.status === 'reviewed' ? 'Reviewed by teacher' : 'Waiting for review'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {submission.submittedAt ? formatDate(submission.submittedAt) : ''}
                  </p>
                </div>

                {submission.note && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{submission.note}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {submission.files.map(file => (
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

                {submission.feedback && (
                  <div className="rounded-xl bg-success-light border border-success/30 p-4">
                    <p className="text-xs font-medium text-success uppercase tracking-wide mb-1">Teacher feedback</p>
                    <p className="text-sm text-foreground leading-relaxed">{submission.feedback}</p>
                    {submission.reviewedAt && (
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(submission.reviewedAt)}</p>
                    )}
                  </div>
                )}
              </Card>
            </section>
          )}

          {canSubmit && (
            <section aria-labelledby="submit-work">
              <h3 id="submit-work" className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                <Send className="h-4 w-4" />
                {submission ? 'Resubmit your work' : 'Submit your work'}
              </h3>
              <form id="hw-submit" onSubmit={handleSubmit} className="space-y-4">
                <Card variant="default" padding="lg" className="space-y-4">
                  <FileUpload
                    onFilesChange={setFiles}
                    maxFiles={5}
                    initialFiles={files}
                    label="Attach your work"
                    description="Images, PDFs, or videos — drag & drop or click to browse"
                  />
                  <Textarea
                    label="Note to teacher"
                    placeholder="Anything you'd like to add about your work…"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                  />
                </Card>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={submitting}>
                    Back
                  </Button>
                  <Button type="submit" size="lg" className="flex-1" isLoading={submitting}>
                    <Send className="h-4 w-4" />
                    {submission ? 'Resubmit' : 'Submit homework'}
                  </Button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>

      {imagePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setImagePreview(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setImagePreview(null)}
            aria-label="Close preview"
          >
            ✕
          </button>
          <div className="max-w-3xl max-h-[80vh] w-full bg-surface rounded-xl flex flex-col items-center p-3" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Attachment preview" className="max-h-[70vh] w-auto object-contain rounded-lg" />
          </div>
        </div>
      )}
    </AppShell>
  );
}
