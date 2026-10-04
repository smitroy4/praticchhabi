'use client';

import { forwardRef, HTMLAttributes, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, open, onClose, title, description, size = 'md', closeOnOverlayClick = true, showCloseButton = true, children, ...props }, ref) => {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
      if (open) {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }, [open, handleKeyDown]);

    if (!open) return null;

    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-4xl',
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined} aria-describedby={description ? 'modal-description' : undefined}>
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={ref}
          className={cn(
            'relative w-full bg-surface rounded-xl shadow-xl animate-scale-in overflow-hidden',
            sizes[size],
            className
          )}
          {...props}
        >
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-lg font-medium text-foreground">{title}</h2>
                )}
                {description && (
                  <p id="modal-description" className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}
          <div className="p-4 sm:p-5">{children}</div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';