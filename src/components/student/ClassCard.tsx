'use client';

import { formatTime, formatDateShort, getDayName, cn, timeUntilClass, formatTimeUntil } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Calendar, Clock, Video, MapPin, AlertTriangle } from 'lucide-react';
import type { ClassSession } from '@/types';

interface ClassCardProps {
  class: ClassSession;
  variant?: 'default' | 'compact' | 'next';
  showTeacher?: boolean;
  onClick?: () => void;
}

export function ClassCard({ class: classSession, variant = 'default', showTeacher = true, onClick }: ClassCardProps) {
  const isOnline = classSession.type === 'online';
  const timeUntil = timeUntilClass(classSession.date, classSession.startTime);
  const isUpcoming = timeUntil > 0 && timeUntil < 24 * 60 * 60 * 1000;

  const handleClick = () => {
    if (onClick) onClick();
    else if (isOnline && classSession.meetingUrl) window.open(classSession.meetingUrl, '_blank');
  };

  if (variant === 'next') {
    return (
      <Card variant="elevated" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center">
            <Video className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary" size="sm" dot>Next Class</Badge>
              {isOnline && <Badge variant="secondary" size="sm" dot>Online</Badge>}
            </div>
            <h3 className="text-xl font-medium text-foreground mb-1">{classSession.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{classSession.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateShort(classSession.date)}, {getDayName(classSession.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatTime(classSession.startTime)} - {formatTime(classSession.endTime)}
              </span>
              {isOnline ? (
                <span className="flex items-center gap-1.5">
                  <Video className="h-4 w-4" />
                  Google Meet
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Studio
                </span>
              )}
            </div>
            {showTeacher && (
              <div className="mt-4 flex items-center gap-3">
                <Avatar name="Debraj Dasgupta" size="sm" />
                <div>
                  <p className="text-xs text-muted-foreground">Teacher</p>
                  <p className="text-sm font-medium">Debraj Dasgupta</p>
                </div>
              </div>
            )}
            {isOnline && classSession.meetingUrl && (
              <Button className="mt-4 w-full sm:w-auto" onClick={() => window.open(classSession.meetingUrl!, '_blank')}>
                <Video className="h-4 w-4" />
                Join Google Meet
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card variant="outlined" padding="sm" className="flex items-center gap-3 pressable" onClick={handleClick}>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', isOnline ? 'bg-secondary-light text-secondary' : 'bg-primary-light text-primary')}>
          {isOnline ? <Video className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{classSession.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateShort(classSession.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(classSession.startTime)}
            </span>
            {isOnline && <Badge variant="secondary" size="sm">Online</Badge>}
          </div>
        </div>
        {isUpcoming && (
          <Badge variant="warning" size="sm" className="flex-shrink-0">
            <AlertTriangle className="h-3 w-3" />
            {formatTimeUntil(timeUntil)}
          </Badge>
        )}
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md" className={cn('transition-smooth', onClick && 'cursor-pointer')} onClick={handleClick}>
      <div className="flex items-start gap-3">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', isOnline ? 'bg-secondary-light text-secondary' : 'bg-primary-light text-primary')}>
          {isOnline ? <Video className="h-6 w-6" /> : <Calendar className="h-6 w-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-foreground">{classSession.title}</h3>
            {isOnline && <Badge variant="secondary" size="sm">Online</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{classSession.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDateShort(classSession.date)}, {getDayName(classSession.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTime(classSession.startTime)} - {formatTime(classSession.endTime)}
            </span>
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-secondary">
                <Video className="h-4 w-4" />
                Google Meet
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Studio
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}