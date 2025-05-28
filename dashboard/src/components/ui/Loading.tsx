import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

const Loading: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}> = ({ size = 'md', className, text }) => {
  return (
    <div
      className={cn('flex items-center justify-center space-x-2', className)}
    >
      <Loading size={size} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

const LoadingPage: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <Loading size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon: Icon, title, description, action, className }) => {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && (
        <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
          <Icon className="h-full w-full" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

const ErrorState: React.FC<{
  title?: string;
  message?: string;
  retry?: () => void;
  className?: string;
}> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  retry,
  className,
}) => {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto h-12 w-12 text-destructive mb-4">
        <svg
          className="h-full w-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Try again
        </button>
      )}
    </div>
  );
};

export { Loading, LoadingSpinner, LoadingPage, EmptyState, ErrorState };
