'use client';

import { formatDateShort, cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Image as ImageIcon, FileText, Video, Clock, Calendar } from 'lucide-react';
import type { Announcement, AnnouncementAttachment } from '@/types';

const ATTACHMENT_ICONS = {
  image: ImageIcon,
  pdf: FileText,
  video: Video,
  file: FileText,
};

interface AnnouncementCardProps {
  announcement: Announcement;
  variant?: 'default' | 'compact' | 'feed';
  onClick?: () => void;
}

export function AnnouncementCard({ announcement, variant = 'default', onClick }: AnnouncementCardProps) {
  const hasImage = announcement.attachments.some(a => a.type === 'image');
  const imageAttachment = announcement.attachments.find(a => a.type === 'image');

  if (variant === 'feed') {
    return (
      <Card variant="default" padding="md" className={cn('transition-smooth', onClick && 'cursor-pointer')} onClick={onClick}>
        <div className="flex items-start gap-3">
          <Avatar src={announcement.authorRole === 'teacher' ? '/avatars/debraj.jpg' : '/avatars/admin.jpg'} name={announcement.authorName} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-medium text-foreground">{announcement.title}</h3>
              <Badge variant="outline" size="sm">{announcement.authorRole}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{announcement.description}</p>
            {hasImage && imageAttachment && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-muted">
                {imageAttachment.thumbnailUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- attachment URLs come from the API (incl. blob previews) */
                  <img src={imageAttachment.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted">
                    <ImageIcon className="h-8 w-8" aria-hidden="true" />
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateShort(announcement.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {announcement.authorName}
              </span>
              {announcement.attachments.length > (hasImage ? 1 : 0) && (
                <Badge variant="outline" size="sm">
                  +{announcement.attachments.length - (hasImage ? 1 : 0)} attachment{announcement.attachments.length - (hasImage ? 1 : 0) > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card variant="outlined" padding="sm" className="flex items-start gap-3 pressable" onClick={onClick}>
        <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
          <ImageIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{announcement.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{announcement.authorName}</span>
            <span>·</span>
            <span>{formatDateShort(announcement.createdAt)}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md" className={cn('transition-smooth', onClick && 'cursor-pointer')} onClick={onClick}>
      <div className="flex items-start gap-3">
        <Avatar src={announcement.authorRole === 'teacher' ? '/avatars/debraj.jpg' : '/avatars/admin.jpg'} name={announcement.authorName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-foreground">{announcement.title}</h3>
            <Badge variant="outline" size="sm">{announcement.authorRole}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{announcement.description}</p>
          {announcement.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {announcement.attachments.map(att => (
                <AttachmentBadge key={att.id} attachment={att} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateShort(announcement.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {announcement.authorName}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AttachmentBadge({ attachment }: { attachment: AnnouncementAttachment }) {
  const Icon = ATTACHMENT_ICONS[attachment.type] || FileText;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-foreground">{attachment.name}</span>
    </span>
  );
}