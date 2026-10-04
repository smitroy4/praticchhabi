'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <hr
      ref={ref}
      className={cn(
        'border-border',
        orientation === 'horizontal' ? 'w-full' : 'h-full',
        className
      )}
      aria-orientation={orientation}
      role={decorative ? 'none' : 'separator'}
      {...props}
    />
  )
);

Separator.displayName = 'Separator';