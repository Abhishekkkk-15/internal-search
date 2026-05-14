import React from 'react';
import { Database, Check } from 'lucide-react';
import { SourceType } from '@nexus/types';
import { cn } from '../lib/utils';
import { SourceIcon } from './SourceIcon';

interface SourceSelectorProps {
  selectedSources: SourceType[];
  onChange: (sources: SourceType[]) => void;
  className?: string;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  selectedSources,
  onChange,
  className,
}) => {
  const availableSources: SourceType[] = ['slack', 'notion', 'github', 'drive', 'jira'];

  const toggleSource = (source: SourceType) => {
    if (selectedSources.includes(source)) {
      onChange(selectedSources.filter((s) => s !== source));
    } else {
      onChange([...selectedSources, source]);
    }
  };

  const isAllSelected = selectedSources.length === availableSources.length || selectedSources.length === 0;

  const selectAll = () => {
    if (isAllSelected && selectedSources.length > 0) {
      onChange([]);
    } else {
      onChange(availableSources);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <div className="flex items-center gap-1 mr-1 text-slate-400 dark:text-slate-500 text-xs font-medium shrink-0">
        <Database className="w-3 h-3" />
        <span className="hidden sm:inline">Scope:</span>
      </div>

      <button
        type="button"
        onClick={selectAll}
        className={cn(
          'px-2 py-0.5 rounded-md text-[11px] font-medium transition-all border',
          isAllSelected
            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
        )}
      >
        All Sources
      </button>

      {availableSources.map((src) => {
        const active = selectedSources.includes(src);
        return (
          <button
            type="button"
            key={src}
            onClick={() => toggleSource(src)}
            className={cn(
              'relative rounded-md transition-all border',
              active ? 'ring-1 ring-indigo-500 scale-105 shadow-2xs' : 'opacity-60 hover:opacity-100 border-transparent'
            )}
            title={`Toggle ${src}`}
          >
            <SourceIcon source={src} showLabel={false} />
            {active && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white dark:border-slate-950 flex items-center justify-center">
                <Check className="w-1.5 h-1.5 text-white stroke-[3]" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
