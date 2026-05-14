import React from 'react';
import { cn } from '../lib/utils';

interface LoadingSkeletonProps {
  type?: 'chat' | 'search' | 'card';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'chat',
  count = 1,
  className,
}) => {
  const items = Array.from({ length: count });

  if (type === 'search') {
    return (
      <div className={cn('space-y-4 w-full', className)}>
        {items.map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full', className)}>
        {items.map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
              <div className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-between">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // default type === 'chat'
  return (
    <div className={cn('space-y-6 w-full', className)}>
      {items.map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'flex-row' : 'flex-row-reverse')}>
          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 animate-pulse"></div>
          <div className={cn('space-y-2 max-w-[70%] w-full', i % 2 !== 0 && 'text-right')}>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20 inline-block animate-pulse"></div>
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/40 space-y-2 animate-pulse">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
              {i % 2 === 0 && <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
