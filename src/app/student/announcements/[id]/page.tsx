'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAsync } from '@/lib/useAsync';
import { announcementsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Calendar, FileText, Image as ImageIcon,
  Video, Eye, Paperclip,
} from 'lucide-react';

const FILE_ICONS = { image: ImageIcon, pdf: FileText, video: Video, file: FileText } as const;

export default function StudentAnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(() => announcementsApi.get(id), [id]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const markedRef = useRef(false);

  const announcement = data?.announcement ?? null;

  useEffect(() => {
    if (!announcement || markedRef.current) return;
    markedRef.current = true;
    announcementsApi.markRead(id)
      .then(() => {
        toast({
          title: 'Marked as read',
          description: `"${announcement.title}" is now marked as read.`,
          type: 'success',
        });
      })
      .catch((err: unknown) => {
        toast({
          title: 'Could not mark as read',
          description: err instanceof Error ? err.message : 'Something went wrong',
          type: 'error',
        });
      });
  }, [announcement, id, toast]);

  if (loading) {
    return (
      <AppShell role="student" showBottomNav={false} showTopBar topBarTitle="Announcement">
        <div className="px-4 py-4 max-w-[720px] mx-auto space-y-4" aria-busy="true" aria-label="Loading announcement">
          <div className="h-9 w-2/3 bg-muted rounded-lg animate-pulse" />
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell role="student" showBottomNav={false} showTopBar topBarTitle="Announcement">
        <div className="px-4 py-4 max-w-[720px] mx-auto">
          <PageHeader title="Announcement" backAction={() => router.back()} />
          <EmptyState
            illustration="announcements"
            title="Could not load announcement"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        </div>
      </AppShell>
    );
  }

  if (!announcement) {
    return (
      <AppShell role="student" showBottomNav={false} showTopBar topBarTitle="Announcements">
        <div className="px-4 py-4 max-w-[720px] mx-auto">
          <PageHeader title="Announcement" backAction={() => router.back()} />
          <EmptyState
            illustration="announcements"
            title="Announcement not found"
            description="This announcement doesn't exist or has been removed."
            action={<Button variant="outline" onClick={() => router.back()}>Go Back</Button>}
          />
        </div>
      </AppShell>
    );
  }

  const heroAttachment = announcement.attachments.find(a => a.type === 'image');
  const otherAttachments = announcement.attachments.filter(a => a !== heroAttachment);

  return (
    <AppShell role="student" showBottomNav={false} showTopBar topBarTitle="Announcement">
      <div className="max-w-[720px] mx-auto pb-8">
        <div className="px-4 pt-4">
          <PageHeader
            title={announcement.title}
            backAction={() => router.back()}
            action={<Badge variant="outline" size="md">{announcement.authorRole}</Badge>}
          />
        </div>

        <div className="mt-6 space-y-5 px-4">
          {heroAttachment && (
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted">
              <button
                onClick={() => setImagePreview(heroAttachment.url)}
                className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Preview ${heroAttachment.name}`}
              >
                <ImageIcon className="h-12 w-12" />
                <span className="text-sm mt-2">{heroAttachment.name}</span>
              </button>
            </div>
          )}

          <Card variant="default" padding="lg">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{announcement.description}</p>
          </Card>

          <Card variant="outlined" padding="md">
            <div className="flex items-center gap-3">
              <Avatar
                src={announcement.authorRole === 'teacher' ? '/avatars/debraj.jpg' : '/avatars/admin.jpg'}
                name={announcement.authorName}
                size="md"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{announcement.authorName}</p>
                <p className="text-xs text-muted-foreground capitalize">{announcement.authorRole}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(announcement.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </Card>

          {otherAttachments.length > 0 && (
            <section aria-labelledby="attachments">
              <h3 id="attachments" className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </h3>
              <div className="space-y-3">
                {otherAttachments.map(att => {
                  const Icon = FILE_ICONS[att.type] || FileText;
                  return (
                    <Card key={att.id} variant="outlined" padding="md" className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                        <p className="text-xs text-muted-foreground">{att.type.toUpperCase()}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
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

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back to Announcements
            </Button>
          </div>
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
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 text-lg"
            onClick={() => setImagePreview(null)}
            aria-label="Close preview"
          >
            ✕
          </button>
          <div className="max-w-3xl max-h-[80vh] w-full bg-surface rounded-xl flex flex-col items-center p-3" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Announcement attachment preview" className="max-h-[70vh] w-auto object-contain rounded-lg" />
          </div>
        </div>
      )}
    </AppShell>
  );
}
