'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { AnnouncementCard } from '@/components/student/AnnouncementCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAsync } from '@/lib/useAsync';
import { announcementsApi } from '@/lib/api';
import type { Announcement } from '@/types';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';

function audienceLabel(audience: Announcement['audience']): string {
  if (Array.isArray(audience)) return `${audience.length} selected`;
  if (audience === 'students') return 'All students';
  if (audience === 'teachers') return 'All teachers';
  return 'Everyone';
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(() => announcementsApi.list(), []);
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
    <AppShell role="admin" showBottomNav showTopBar topBarTitle="Announcements">
      <div className="px-4 py-4 max-w-[720px] mx-auto">
        <PageHeader
          title="Announcements"
          description="Manage school-wide announcements"
          action={
            <Button asChild>
              <Link href="/admin/announcements/create">
                <Plus className="h-4 w-4" />
                New Announcement
              </Link>
            </Button>
          }
        />

        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading announcements">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
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

        {!loading && !error && announcements.length > 0 && (
          <div className="space-y-4">
            {announcements.map(ann => (
              <div key={ann.id} className="space-y-2">
                <AnnouncementCard announcement={ann} variant="feed" />
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <Badge variant="secondary" size="sm">
                    <Users className="h-3 w-3" />
                    {audienceLabel(ann.audience)}
                  </Badge>
                  {ann.attachments.length > 0 && (
                    <Badge variant="outline" size="sm">
                      {ann.attachments.length} attachment{ann.attachments.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/announcements/create?id=${ann.id}`)}
                      disabled={deleting}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-error"
                      aria-label={`Delete ${ann.title}`}
                      onClick={() => setPendingDelete(ann)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && announcements.length === 0 && (
          <EmptyState
            illustration="announcements"
            title="No announcements yet"
            description="Create your first announcement."
            action={
              <Button asChild>
                <Link href="/admin/announcements/create">
                  <Plus className="h-4 w-4" />
                  New Announcement
                </Link>
              </Button>
            }
          />
        )}

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
