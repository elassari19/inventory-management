import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const drawerSizes = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[32rem]',
  xl: 'w-[40rem]',
};

const drawerSides = {
  left: {
    container: 'justify-start',
    panel: 'translate-x-0',
    panelClosed: '-translate-x-full',
  },
  right: {
    container: 'justify-end',
    panel: 'translate-x-0',
    panelClosed: 'translate-x-full',
  },
};

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = 'right',
  size = 'md',
  className,
}: DrawerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, mounted]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex transition-opacity duration-300',
        drawerSides[side].container,
        isOpen
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          'relative h-full bg-white shadow-xl border-l flex flex-col transition-transform duration-300 ease-in-out',
          drawerSizes[size],
          isOpen ? drawerSides[side].panel : drawerSides[side].panelClosed,
          side === 'left' && 'border-l-0 border-r',
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="border-b px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

// Drawer content components for better structure
export function DrawerContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('px-6 py-4 flex-1', className)}>{children}</div>;
}

export function DrawerFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-t px-6 py-4 flex justify-end space-x-2 flex-shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
}
