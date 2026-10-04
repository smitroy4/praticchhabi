'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backAction?: () => void;
  backHref?: string;
  className?: string;
}

export function PageHeader({ title, description, action, backAction, backHref, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4', className)}>
      <div className="flex-1 min-w-0">
        {backAction || backHref ? (
          <a
            href={backHref}
            onClick={e => { if (backAction) { e.preventDefault(); backAction(); } }}
            className={cn(
              'inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-3 pressable',
              backHref && 'cursor-pointer'
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </a>
        ) : null}
        <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0 mt-4 sm:mt-0">{action}</div>}
    </header>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  count?: number;
  className?: string;
}

export function SectionHeader({ title, description, action, count, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3', className)}>
      <div>
        <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
