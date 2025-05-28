import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, style }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      style={style}
    />
  );
};

// Card Skeleton for dashboard cards
export const CardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={cn('p-6 border rounded-lg', className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};

// Table Skeleton for data tables
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Table Header */}
      <div className="flex space-x-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Page Header Skeleton
export const PageHeaderSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
};

// Metrics Grid Skeleton
export const MetricsGridSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 4, className }) => {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
};

// Chart Skeleton
export const ChartSkeleton: React.FC<{
  height?: number;
  className?: string;
}> = ({ height = 300, className }) => {
  return (
    <div className={cn('p-6 border rounded-lg', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className={`w-full`} style={{ height: `${height}px` }} />
        <div className="flex justify-center space-x-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC<{
  count?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ count = 3, showAvatar = false, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 p-3 border rounded-lg"
        >
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC<{
  fields?: number;
  className?: string;
}> = ({ fields = 4, className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

// Navigation Skeleton
export const NavigationSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
};
