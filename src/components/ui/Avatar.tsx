'use client';

import { forwardRef, HTMLAttributes, Children } from 'react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'rounded';
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', shape = 'circle', ...props }, ref) => {
    const sizes = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
    };

    const shapes = {
      circle: 'rounded-full',
      rounded: 'rounded-xl',
    };

    const showFallback = !src || src === '';
    const initials = name ? getInitials(name) : '?';

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium bg-primary-light text-primary overflow-hidden',
          sizes[size],
          shapes[shape],
          className
        )}
        {...props}
      >
        {showFallback ? (
          <span aria-hidden="true">{initials}</span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- avatars can be arbitrary URLs (blob previews), next/image can't optimize them */
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function AvatarGroup({ className, max = 5, size = 'md', children, ...props }: AvatarGroupProps) {
  const kids = Children.toArray(children);
  const visible = kids.slice(0, max);
  const remaining = kids.length - max;

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {visible.map((child, index) => (
        <div key={index} className="relative z-10">
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div className={cn('relative z-0 ml-1 bg-muted text-muted-foreground font-medium border-2 border-background rounded-full', {
          'h-6 w-6 text-xs': size === 'xs',
          'h-8 w-8 text-sm': size === 'sm',
          'h-10 w-10 text-base': size === 'md',
          'h-12 w-12 text-lg': size === 'lg',
          'h-16 w-16 text-xl': size === 'xl',
        })}>
        +{remaining}
      </div>
      )}
    </div>
  );
}