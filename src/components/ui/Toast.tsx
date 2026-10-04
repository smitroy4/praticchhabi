'use client';

import { useState, useCallback, ReactNode, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from './Button';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const t = { ...newToast, id };
    setToasts(prev => [...prev, t]);

    if (newToast.duration !== 0) {
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), newToast.duration ?? 5000);
    }

    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-error" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-primary" />,
  };

  const bgColors = {
    success: 'bg-success-light border-success/20',
    error: 'bg-error-light border-error/20',
    warning: 'bg-warning-light border-warning/20',
    info: 'bg-primary-light border-primary/20',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-up min-w-[300px] max-w-md',
            bgColors[t.type]
          )}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{t.title}</p>
            {t.description && <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>}
            {t.action && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={t.action.onClick}>
                {t.action.label}
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => onDismiss(t.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
