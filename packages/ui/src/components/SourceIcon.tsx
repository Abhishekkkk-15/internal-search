import React from 'react';
import { MessageSquare, FileText, Github, HardDrive, Layers } from 'lucide-react';
import { SourceType } from '@nexus/types';
import { cn } from '../lib/utils';

interface SourceIconProps {
  source: SourceType;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
}

export const SourceIcon: React.FC<SourceIconProps> = ({
  source,
  className,
  iconClassName,
  showLabel = false,
}) => {
  const config: Record<SourceType, { icon: React.ElementType; label: string; bg: string; text: string }> = {
    slack: {
      icon: MessageSquare,
      label: 'Slack',
      bg: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20',
      text: 'text-purple-600 dark:text-purple-400',
    },
    notion: {
      icon: FileText,
      label: 'Notion',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
    },
    github: {
      icon: Github,
      label: 'GitHub',
      bg: 'bg-slate-500/10 dark:bg-slate-500/20 border-slate-500/20',
      text: 'text-slate-700 dark:text-slate-300',
    },
    drive: {
      icon: HardDrive,
      label: 'Google Drive',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    jira: {
      icon: Layers,
      label: 'Jira',
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-500/20',
      text: 'text-cyan-600 dark:text-cyan-400',
    },
  };

  const current = config[source] || {
    icon: FileText,
    label: source,
    bg: 'bg-gray-500/10 border-gray-500/20',
    text: 'text-gray-500',
  };

  const IconComponent = current.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium transition-colors',
        current.bg,
        current.text,
        className
      )}
    >
      <IconComponent className={cn('w-3.5 h-3.5 shrink-0', iconClassName)} />
      {showLabel && <span>{current.label}</span>}
    </div>
  );
};
