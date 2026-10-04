'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  illustration?: 'homework' | 'announcements' | 'calendar' | 'classes' | 'search';
}

const illustrations = {
  homework: (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 text-muted" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 8h40a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" />
      <path d="M12 16h40" strokeLinecap="round" />
      <path d="M16 24h20" strokeLinecap="round" />
      <path d="M16 32h28" strokeLinecap="round" />
      <path d="M16 40h16" strokeLinecap="round" />
      <circle cx="48" cy="48" r="4" />
    </svg>
  ),
  announcements: (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 text-muted" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 12h48a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 24h16" strokeLinecap="round" />
      <path d="M16 32h24" strokeLinecap="round" />
      <path d="M16 40h12" strokeLinecap="round" />
      <circle cx="48" cy="18" r="4" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 text-muted" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 18h44a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4z" />
      <path d="M10 28h44" strokeLinecap="round" />
      <path d="M18 14v-6" strokeLinecap="round" />
      <path d="M46 14v-6" strokeLinecap="round" />
      <path d="M18 36h12" strokeLinecap="round" />
      <path d="M18 44h20" strokeLinecap="round" />
      <path d="M18 52h8" strokeLinecap="round" />
    </svg>
  ),
  classes: (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 text-muted" stroke="currentColor" strokeWidth="1.5">
      <circle cx="20" cy="20" r="8" />
      <circle cx="44" cy="20" r="8" />
      <circle cx="20" cy="44" r="8" />
      <circle cx="44" cy="44" r="8" />
      <path d="M28 20h16" strokeLinecap="round" />
      <path d="M28 44h16" strokeLinecap="round" />
      <path d="M20 28v16" strokeLinecap="round" />
      <path d="M44 28v16" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 text-muted" stroke="currentColor" strokeWidth="1.5">
      <circle cx="24" cy="24" r="14" />
      <path d="M38 38l16 16" strokeLinecap="round" />
      <path d="M24 10v0" />
    </svg>
  ),
};

export function EmptyState({ icon, title, description, action, className, illustration }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-12 px-4', className)}>
      {icon || (illustration && illustrations[illustration]) || (
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 text-muted" stroke="currentColor" strokeWidth="1.5">
          <circle cx="32" cy="32" r="24" />
          <path d="M32 20v12" strokeLinecap="round" />
          <path d="M32 44v0" strokeLinecap="round" />
        </svg>
      )}
      <h3 className="mt-6 text-lg font-medium text-foreground">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}