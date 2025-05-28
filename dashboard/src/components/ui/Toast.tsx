import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & ToastProps
>(
  (
    { className, title, description, type = 'default', onClose, ...props },
    ref
  ) => {
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onClose?.();
      }, 5000);

      return () => clearTimeout(timer);
    }, [onClose]);

    const getTypeStyles = () => {
      switch (type) {
        case 'success':
          return 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100';
        case 'error':
          return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100';
        case 'warning':
          return 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100';
        default:
          return 'border bg-background text-foreground';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
          getTypeStyles(),
          className
        )}
        {...props}
      >
        <div className="grid gap-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="absolute right-2 top-2 h-6 w-6 rounded-md p-0 hover:bg-background/20"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export { Toast };
