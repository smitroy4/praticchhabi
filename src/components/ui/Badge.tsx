'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-primary-light text-primary',
      secondary: 'bg-secondary-light text-secondary',
      success: 'bg-success-light text-success',
      warning: 'bg-warning-light text-warning',
      error: 'bg-error-light text-error',
      outline: 'border border-border-strong bg-transparent',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-xs gap-1.5',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full transition-smooth',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';