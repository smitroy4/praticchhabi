'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ children, defaultValue, value, onValueChange }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;

  const handleChange = (newValue: string) => {
    if (!controlled) setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div data-tabs>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div className={cn('flex gap-1 bg-muted rounded-lg p-1', className)} role="tablist" {...props}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function TabsTrigger({ value, children, disabled, className }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const isActive = context.value === value;
  
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && context.onValueChange(value)}
      className={cn(
        'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isActive ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  if (context.value !== value) return null;
  
  return (
    <div role="tabpanel" className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}