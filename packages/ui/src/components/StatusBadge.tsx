import React from 'react';
import { cn } from '../lib/utils';

export type StatusType = 'connected' | 'disconnected' | 'syncing' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  customLabel,
}) => {
  const config: Record<StatusType, { label: string; dot: string; bg: string; text: string }> = {
    connected: {
      label: 'Connected',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    syncing: {
      label: 'Syncing...',
      dot: 'bg-amber-500 animate-pulse',
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-700 dark:text-amber-400',
    },
    disconnected: {
      label: 'Disconnected',
      dot: 'bg-gray-400 dark:bg-gray-600',
      bg: 'bg-gray-500/10 border-gray-500/20',
      text: 'text-gray-600 dark:text-gray-400',
    },
    error: {
      label: 'Sync Error',
      dot: 'bg-rose-500 animate-ping',
      bg: 'bg-rose-500/10 border-rose-500/20',
      text: 'text-rose-700 dark:text-rose-400',
    },
  };

  const current = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm',
        current.bg,
        current.text,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {status === 'syncing' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', current.dot)}></span>
      </span>
      {customLabel || current.label}
    </span>
  );
};
