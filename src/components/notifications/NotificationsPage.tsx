'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAsync } from '@/lib/useAsync';
import { notificationsApi } from '@/lib/api';
import type { Notification, NotificationType } from '@/types';
import {
  Bell, CalendarClock, ClipboardCheck, FilePlus2, Megaphone, Star, Info, CheckCheck,
} from 'lucide-react';

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  class_reminder: CalendarClock,
  homework_due: ClipboardCheck,
  homework_new: FilePlus2,
  homework_reviewed: Star,
  announcement: Megaphone,
  general: Info,
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24 && date.toDateString() === now.toDateString()) return `${hours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsync(() => notificationsApi.list(), []);
  const [busy, setBusy] = useState(false);

  const notifications: Notification[] = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  const markAllRead = async () => {
    setBusy(true);
    try {
      await notificationsApi.markRead();
      toast({ title: 'All caught up', description: 'Notifications marked as read.', type: 'success' });
      reload();
    } catch (err) {
      toast({
        title: 'Could not update notifications',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-4 max-w-[720px] mx-auto pb-24">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `You have ${unread} unread notification${unread === 1 ? '' : 's'}` : "You're all caught up"}
        backAction={() => router.back()}
        action={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={busy} isLoading={busy}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 space-y-3">
        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState
            title="Could not load notifications"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        )}

        {!loading && !error && notifications.length === 0 && (
          <EmptyState
            icon={<Bell className="h-10 w-10 text-muted" />}
            title="No notifications yet"
            description="Class reminders, new assignments, and announcements will show up here."
          />
        )}

        {!loading && !error && notifications.map(n => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          return (
            <Card
              key={n.id}
              variant="default"
              padding="md"
              className={n.read ? 'opacity-70' : undefined}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-muted text-muted-foreground' : 'bg-primary-light text-primary'}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" aria-label="Unread" />}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{formatWhen(n.createdAt)}</span>
                    {!n.read && <Badge variant="primary" size="sm">New</Badge>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
