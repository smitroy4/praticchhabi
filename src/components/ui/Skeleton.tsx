'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height, ...props }: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        'bg-muted animate-pulse',
        variants[variant],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%' } />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      <Skeleton variant="rectangular" height="160px" width="100%" />
      <div className="space-y-2 px-1">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className, ...props }: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string } & HTMLAttributes<HTMLDivElement>) {
  const sizes = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Skeleton variant="circular" className={cn(sizes[size], className)} {...props} />
  );
}