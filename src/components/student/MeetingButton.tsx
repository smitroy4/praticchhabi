'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Video, ExternalLink } from 'lucide-react';

interface MeetingButtonProps {
  meetingUrl?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function MeetingButton({ meetingUrl, label = 'Join Google Meet', variant = 'primary', size = 'md', disabled, className }: MeetingButtonProps) {
  const isDisabled = disabled || !meetingUrl;

  const handleClick = () => {
    if (meetingUrl && !isDisabled) {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isDisabled}
      className={cn('gap-2', className)}
      aria-disabled={isDisabled}
    >
      <Video className="h-4 w-4" />
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </Button>
  );
}