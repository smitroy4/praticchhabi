'use client';

import { formatDateShort, isOverdue, cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, Image, Video, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Homework, HomeworkAttachment } from '@/types';

const FILE_ICONS = {
  image: Image,
  pdf: FileText,
  video: Video,
  file: FileText,
};

interface HomeworkCardProps {
  homework: Homework;
  variant?: 'default' | 'compact' | 'detail';
  onClick?: () => void;
  showActions?: boolean;
}

export function HomeworkCard({ homework, variant = 'default', onClick, showActions = true }: HomeworkCardProps) {
  const overdue = isOverdue(homework.dueDate) && homework.status === 'pending';
  const status = homework.status;

  const statusConfig = {
    pending: { variant: 'warning' as const, label: 'Pending', icon: Clock },
    submitted: { variant: 'secondary' as const, label: 'Submitted', icon: CheckCircle },
    reviewed: { variant: 'success' as const, label: 'Reviewed', icon: CheckCircle },
    completed: { variant: 'success' as const, label: 'Completed', icon: CheckCircle },
    overdue: { variant: 'error' as const, label: 'Overdue', icon: AlertTriangle },
  };

  const currentStatus = overdue ? 'overdue' : status;
  const { variant: statusVariant, label: statusLabel, icon: StatusIcon } = statusConfig[currentStatus];

  if (variant === 'compact') {
    return (
      <Card variant="outlined" padding="sm" className="flex items-center gap-3 pressable" onClick={onClick}>
        <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{homework.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due {formatDateShort(homework.dueDate)}
            </span>
            <Badge variant={statusVariant} size="sm">
              <StatusIcon className="h-3 w-3" />
              {statusLabel}
            </Badge>
          </div>
        </div>
        {homework.attachments.length > 0 && (
          <Badge variant="outline" size="sm">{homework.attachments.length}</Badge>
        )}
      </Card>
    );
  }

  if (variant === 'detail') {
    return (
      <Card variant="elevated" padding="lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-medium text-foreground">{homework.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{homework.description}</p>
          </div>
          <Badge variant={statusVariant} size="md">
            <StatusIcon className="h-4 w-4" />
            {statusLabel}
          </Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Assigned {formatDateShort(homework.assignedDate)}</span>
          </div>
          <div className={cn('flex items-center gap-2 text-sm', overdue ? 'text-error' : 'text-muted-foreground')}>
            <Clock className="h-4 w-4" />
            <span>Due {formatDateShort(homework.dueDate)}</span>
          </div>
        </div>

        {homework.attachments.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Attachments</h4>
            <div className="flex flex-wrap gap-2">
              {homework.attachments.map(att => (
                <AttachmentPreview key={att.id} attachment={att} />
              ))}
            </div>
          </div>
        )}

        {showActions && status === 'pending' && (
          <p className="text-sm text-muted-foreground">Not submitted yet</p>
        )}
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md" className={cn('transition-smooth', onClick && 'cursor-pointer')} onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-foreground truncate">{homework.title}</h3>
            <Badge variant={statusVariant} size="sm">
              <StatusIcon className="h-3 w-3" />
              {statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{homework.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Due {formatDateShort(homework.dueDate)}
            </span>
            {homework.attachments.length > 0 && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                {homework.attachments.length} attachment{homework.attachments.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AttachmentPreview({ attachment }: { attachment: HomeworkAttachment }) {
  const Icon = FILE_ICONS[attachment.type] || FileText;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-foreground truncate max-w-[150px]">{attachment.name}</span>
    </div>
  );
}