'use client';

import { formatTime, formatDateShort, cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';
import type { ClassSession } from '@/types';

interface ScheduleTimelineProps {
  classes: ClassSession[];
  mode?: 'today' | 'week' | 'upcoming' | 'day';
  showEmpty?: boolean;
  emptyMessage?: string;
}

export function ScheduleTimeline({ classes, mode = 'today', showEmpty = true, emptyMessage }: ScheduleTimelineProps) {
  if (classes.length === 0) {
    if (!showEmpty) return null;
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">No classes scheduled</h3>
        <p className="text-sm text-muted-foreground">{emptyMessage || 'Your schedule is clear for now.'}</p>
      </div>
    );
  }

  const sortedClasses = [...classes].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.startTime}`).getTime();
    const timeB = new Date(`${b.date}T${b.startTime}`).getTime();
    return timeA - timeB;
  });

  return (
    <div className="space-y-3" role="list">
      {sortedClasses.map((classSession, index) => (
        <TimelineItem key={classSession.id} classSession={classSession} index={index} total={sortedClasses.length} mode={mode} />
      ))}
    </div>
  );
}

interface TimelineItemProps {
  classSession: ClassSession;
  index: number;
  total: number;
  mode: 'today' | 'week' | 'upcoming' | 'day';
}

function TimelineItem({ classSession, index, total, mode }: TimelineItemProps) {
  const isOnline = classSession.type === 'online';
  const isLast = index === total - 1;
  const isToday = mode === 'today';

  return (
    <div className="relative flex items-start gap-3" role="listitem">
      <div className="relative flex-shrink-0">
        <div className={cn('w-2 h-2 rounded-full border-2 border-primary bg-surface z-10', isOnline && 'bg-secondary border-secondary')} />
        {!isLast && (
          <div className="absolute left-[5px] top-4 bottom-0 w-0.5 bg-border" />
        )}
      </div>
      <div className="flex-1 min-w-0 pb-4">
        <Card variant="outlined" padding="md" className={cn('w-full', isOnline && 'border-secondary/30')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-medium text-foreground">{classSession.title}</h4>
                {isOnline && <Badge variant="secondary" size="sm">Online</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{classSession.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {isToday && (
                  <>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {formatTime(classSession.startTime)} - {formatTime(classSession.endTime)}
                    </span>
                  </>
                )}
                {!isToday && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDateShort(classSession.date)}, {formatTime(classSession.startTime)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  {isOnline ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  {isOnline ? 'Google Meet' : 'Studio'}
                </span>
              </div>
            </div>
            {isOnline && classSession.meetingUrl && (
              <a
                href={classSession.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 mt-1"
              >
                <Button variant="secondary" size="sm" className="whitespace-nowrap">
                  <Video className="h-4 w-4" />
                  Join
                </Button>
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}