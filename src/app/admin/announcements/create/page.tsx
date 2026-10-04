'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { FileUpload, UploadedFile } from '@/components/ui/FileUpload';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { X, Send, Save, Paperclip } from 'lucide-react';
import { announcementsApi, uploadsApi } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import type { Announcement, Attachment } from '@/types';

export default function CreateAnnouncementPage() {
  return (
    <Suspense fallback={<CreateAnnouncementFallback />}>
      <CreateAnnouncementContent />
    </Suspense>
  );
}

function FormSkeleton() {
  return (
    <div className="px-4 py-4 max-w-[720px] mx-auto pb-24 space-y-4" aria-busy="true" aria-label="Loading announcement">
      <Skeleton className="h-8 w-52" />
      <Skeleton variant="rectangular" className="h-64" />
      <Skeleton variant="rectangular" className="h-44" />
    </div>
  );
}

function CreateAnnouncementFallback() {
  return (
    <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="New Announcement">
      <FormSkeleton />
    </AppShell>
  );
}

function CreateAnnouncementContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id') || null;
  const { data, error, loading, reload } = useAsync<{ announcement: Announcement } | null>(
    () => (editId ? announcementsApi.get(editId) : Promise.resolve(null)),
    [editId]
  );
  const announcement = editId ? (data?.announcement ?? null) : null;

  return (
    <AppShell
      role="admin"
      showBottomNav={false}
      showTopBar
      topBarTitle={editId ? 'Edit announcement' : 'New Announcement'}
    >
      {editId && loading && <FormSkeleton />}

      {editId && !loading && (error || !announcement) && (
        <div className="px-4 py-4 max-w-[720px] mx-auto pb-24">
          <EmptyState
            title="Announcement not found"
            description={error ?? 'This announcement may have been removed.'}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={reload}>
                  Try again
                </Button>
                <Button asChild>
                  <Link href="/admin/announcements">Back to announcements</Link>
                </Button>
              </div>
            }
          />
        </div>
      )}

      {(!editId || announcement) && (
        <AnnouncementForm key={announcement?.id ?? 'create'} announcement={announcement} />
      )}
    </AppShell>
  );
}

function AnnouncementForm({ announcement }: { announcement: Announcement | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = announcement !== null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [description, setDescription] = useState(announcement?.description ?? '');
  const [audience, setAudience] = useState<Announcement['audience']>(announcement?.audience ?? 'all');
  const [publishDate, setPublishDate] = useState('');
  const [kept, setKept] = useState<Attachment[]>(announcement?.attachments ?? []);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const audienceOptions = [
    ...(Array.isArray(audience) ? [{ value: '__selected', label: `${audience.length} selected` }] : []),
    { value: 'all', label: 'Everyone' },
    { value: 'students', label: 'All students' },
    { value: 'teachers', label: 'All teachers' },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const pending = attachments.filter(f => !f.error);
      const uploaded = pending.length ? await uploadsApi.upload(pending.map(f => f.file)) : [];
      const files = [...kept, ...uploaded];

      if (announcement) {
        await announcementsApi.update(announcement.id, {
          title: title.trim(),
          description: description.trim(),
          audience,
          attachments: files,
        });
        toast({
          title: 'Announcement updated',
          description: `"${title.trim()}" has been updated.`,
          type: 'success',
        });
        router.push('/admin/announcements');
        return;
      }

      const scheduled = Boolean(publishDate && publishDate > new Date().toISOString().slice(0, 10));
      await announcementsApi.create({
        title: title.trim(),
        description: description.trim(),
        audience,
        attachments: files,
        publishAt: publishDate ? new Date(`${publishDate}T00:00:00`).toISOString() : undefined,
      });
      toast({
        title: scheduled ? 'Announcement scheduled' : 'Announcement published',
        description: scheduled
          ? `"${title}" will go live on ${publishDate}.`
          : `"${title}" is now visible to your audience.`,
        type: 'success',
      });
      router.push('/admin/announcements');
    } catch (err) {
      toast({
        title: announcement ? 'Could not update announcement' : 'Could not publish announcement',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-4 max-w-[720px] mx-auto pb-24">
      <PageHeader
        title={isEdit ? 'Edit announcement' : 'New Announcement'}
        description={
          isEdit
            ? 'Update the announcement details'
            : 'Share updates, news, and information with your students'
        }
        backAction={() => router.back()}
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        <Card variant="default" padding="lg" className="space-y-5">
          <Input
            label="Title"
            placeholder="e.g. Annual Art Exhibition"
            value={title}
            onChange={e => setTitle(e.target.value)}
            error={errors.title}
            maxLength={120}
          />
          <Textarea
            label="Description"
            placeholder="Write your announcement…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            error={errors.description}
            rows={5}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Audience"
              options={audienceOptions}
              value={Array.isArray(audience) ? '__selected' : audience}
              onChange={e => {
                if (e.target.value === '__selected') return;
                setAudience(e.target.value as 'all' | 'students' | 'teachers');
              }}
            />
            {!isEdit && (
              <Input
                label="Publish date"
                type="date"
                value={publishDate}
                onChange={e => setPublishDate(e.target.value)}
                helperText="Leave empty to publish immediately"
              />
            )}
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <label className="text-sm font-medium text-foreground mb-1 block">Media</label>
          <p className="text-xs text-muted-foreground mb-3">Attach images, videos, or PDFs to enrich your announcement.</p>
          <FileUpload
            onFilesChange={setAttachments}
            maxFiles={4}
            label="Upload media"
            description="Images, videos, or PDFs — drag & drop or click to browse"
          />
          {kept.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Current attachments</p>
              <div className="flex flex-wrap gap-2">
                {kept.map(file => (
                  <span
                    key={file.id}
                    className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-muted rounded-lg text-sm text-foreground"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="max-w-[180px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setKept(prev => prev.filter(a => a.id !== file.id))}
                      aria-label={`Remove ${file.name}`}
                      className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-error hover:bg-background transition-smooth"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-3 sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-t border-border">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={isSubmitting}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting}>
            {isEdit ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {isEdit ? 'Save Changes' : 'Publish'}
          </Button>
        </div>
      </form>
    </div>
  );
}
