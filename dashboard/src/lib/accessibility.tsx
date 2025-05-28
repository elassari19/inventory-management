import React, { useEffect, useRef } from 'react';

// Accessibility utilities and hooks

// Hook for managing focus trap in modals and dropdowns
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const closeButton = container.querySelector(
          '[data-close-modal]'
        ) as HTMLElement;
        closeButton?.click();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    // Focus first element
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
}

// Hook for managing screen reader announcements
export function useScreenReader() {
  const announce = (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
}

// Hook for keyboard navigation in lists
export function useKeyboardNavigation(
  items: any[],
  onSelect?: (item: any, index: number) => void
) {
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const listRef = useRef<HTMLElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && onSelect) {
          onSelect(items[activeIndex], activeIndex);
        }
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
    }
  };

  // Update focus when activeIndex changes
  useEffect(() => {
    if (listRef.current && activeIndex >= 0) {
      const activeElement = listRef.current.children[
        activeIndex
      ] as HTMLElement;
      activeElement?.focus();
    }
  }, [activeIndex]);

  return {
    listRef,
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
}

// ARIA utilities
export const ariaUtils = {
  // Generate unique IDs for form associations
  useId: (prefix = 'id') => {
    const [id] = React.useState(
      () => `${prefix}-${Math.random().toString(36).substr(2, 9)}`
    );
    return id;
  },

  // Create accessible error messages
  createErrorProps: (errorId: string, hasError: boolean) => ({
    'aria-invalid': hasError,
    'aria-describedby': hasError ? errorId : undefined,
  }),

  // Create accessible loading state
  createLoadingProps: (isLoading: boolean, loadingText = 'Loading...') => ({
    'aria-busy': isLoading,
    'aria-label': isLoading ? loadingText : undefined,
  }),

  // Create accessible expanded state for dropdowns
  createExpandedProps: (isExpanded: boolean, controlsId?: string) => ({
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  }),
};

// Color contrast utilities
export const contrastUtils = {
  // Get readable text color based on background
  getContrastColor: (backgroundColor: string): 'light' | 'dark' => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? 'dark' : 'light';
  },

  // Check if color combination meets WCAG guidelines
  meetsWCAG: (
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA'
  ): boolean => {
    // This is a simplified version - in production, use a proper contrast calculation library
    const requiredRatio = level === 'AAA' ? 7 : 4.5;
    // Placeholder implementation
    return true; // Replace with actual contrast ratio calculation
  },
};

// Reduced motion utilities
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Screen reader only text component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <span className="sr-only">{children}</span>;

// Skip link component for keyboard navigation
export const SkipLink: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-primary-foreground px-4 py-2 z-50"
  >
    {children}
  </a>
);

// Focus indicator component
export const FocusIndicator: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${className}`}
  >
    {children}
  </div>
);

// High contrast mode detector
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows high contrast mode
      const testElement = document.createElement('div');
      testElement.style.border = '1px solid';
      testElement.style.borderColor = 'red green';
      document.body.appendChild(testElement);

      const styles = window.getComputedStyle(testElement);
      const isHighContrast = styles.borderTopColor === styles.borderRightColor;

      document.body.removeChild(testElement);
      setIsHighContrast(isHighContrast);
    };

    checkHighContrast();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const handleChange = () => checkHighContrast();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
}

// Landmark component for better navigation
export const Landmark: React.FC<{
  as?: 'main' | 'nav' | 'aside' | 'section' | 'header' | 'footer';
  label?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ as: Component = 'div', label, children, className }) => {
  const ElementType = Component as React.ElementType;

  return (
    <ElementType
      role={Component === 'div' ? 'region' : undefined}
      aria-label={label}
      className={className}
    >
      {children}
    </ElementType>
  );
};

// Accessible tooltip component
export const AccessibleTooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  id?: string;
}> = ({ content, children, id }) => {
  const tooltipId = id || ariaUtils.useId('tooltip');
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative inline-block">
      <div
        aria-describedby={isVisible ? tooltipId : undefined}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-10 px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2"
        >
          {content}
        </div>
      )}
    </div>
  );
};
