'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnnouncementCard } from '@/components/student/AnnouncementCard';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/useAsync';
import { announcementsApi } from '@/lib/api';
import type { Announcement } from '@/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export default function TeacherAnnouncementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsync(() => announcementsApi.list(), []);
  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const announcements = data?.announcements ?? [];

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await announcementsApi.remove(pendingDelete.id);
      toast({
        title: 'Announcement deleted',
        description: `"${pendingDelete.title}" has been removed.`,
        type: 'success',
      });
      setPendingDelete(null);
      reload();
    } catch (err) {
      toast({
        title: 'Could not delete announcement',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell role="teacher" showBottomNav showTopBar topBarTitle="Announcements">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Announcements"
          description="Communicate with your students"
          action={
            <Button asChild>
              <Link href="/teacher/announcements/create">
                <Plus className="h-4 w-4" />
                New Announcement
              </Link>
            </Button>
          }
        />

        <div className="mt-6">
          {loading && (
            <div className="space-y-3" aria-busy="true" aria-label="Loading announcements">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <EmptyState
              title="Could not load announcements"
              description={error}
              action={<Button variant="outline" onClick={reload}>Try again</Button>}
            />
          )}

          {!loading && !error && announcements.length === 0 && (
            <EmptyState
              illustration="announcements"
              title="No announcements yet"
              description="Create your first announcement to keep students informed."
              action={
                <Button asChild>
                  <Link href="/teacher/announcements/create">
                    <Plus className="h-4 w-4" />
                    New Announcement
                  </Link>
                </Button>
              }
            />
          )}

          {!loading && !error && announcements.length > 0 && (
            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="relative">
                  <AnnouncementCard announcement={ann} variant="feed" />
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                    {ann.authorId === user?.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Edit ${ann.title}`}
                          onClick={() => router.push(`/teacher/announcements/create?id=${ann.id}`)}
                          disabled={deleting}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-error"
                          aria-label={`Delete ${ann.title}`}
                          onClick={() => setPendingDelete(ann)}
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          open={Boolean(pendingDelete)}
          onClose={() => setPendingDelete(null)}
          title="Delete announcement?"
          description={pendingDelete ? `"${pendingDelete.title}" will be permanently removed for everyone.` : undefined}
          size="sm"
        >
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} isLoading={deleting}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
