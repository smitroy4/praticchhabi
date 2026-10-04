'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-10 px-3 bg-surface border border-border-strong rounded-lg text-foreground placeholder:text-muted-foreground',
            'transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            'disabled:bg-muted disabled:cursor-not-allowed',
            'aria-invalid:focus:border-error aria-invalid:focus:ring-error/20',
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId || helperId}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">{error}</p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; helperText?: string }>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-3 bg-surface border border-border-strong rounded-lg text-foreground placeholder:text-muted-foreground',
            'transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            'disabled:bg-muted disabled:cursor-not-allowed resize-y min-h-[100px]',
            'aria-invalid:focus:border-error aria-invalid:focus:ring-error/20',
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId || helperId}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">{error}</p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('block text-sm font-medium text-foreground mb-1.5', className)} {...props} />
  )
);
Label.displayName = 'Label';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; options: { value: string; label: string }[] }>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full h-10 px-3 bg-surface border border-border-strong rounded-lg text-foreground',
            'transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            'disabled:bg-muted disabled:cursor-not-allowed appearance-none',
            'aria-invalid:focus:border-error aria-invalid:focus:ring-error/20',
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';