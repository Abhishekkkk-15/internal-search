import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, Calendar, User as UserIcon } from 'lucide-react';
import { SourceType } from '@nexus/types';
import { cn } from '../lib/utils';
import { SourceIcon } from './SourceIcon';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
  // Filters
  selectedSources?: SourceType[];
  onToggleSource?: (source: SourceType) => void;
  authorFilter?: string;
  onAuthorChange?: (author: string) => void;
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search internal repository, documentation, or chat history...',
  className,
  selectedSources = [],
  onToggleSource,
  authorFilter,
  onAuthorChange,
  dateRange,
  onDateRangeChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const sourcesList: SourceType[] = ['slack', 'notion', 'github', 'drive', 'jira'];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-2', className)}>
      {/* Primary search wrapper */}
      <div className="relative flex items-center group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-3.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all"
        />

        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="absolute right-2 flex items-center gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent',
              showFilters && 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
            )}
            title="Toggle Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          {onSearch && (
            <button
              onClick={onSearch}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-sm transition-all"
            >
              Search
            </button>
          )}
        </div>
      </div>

      {/* Collapsible advanced filters dashboard panel */}
      {showFilters && (
        <div className="p-4 rounded-xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-full sm:w-auto sm:mr-2">
              Filter Platforms:
            </span>
            {sourcesList.map((src) => {
              const active = selectedSources.includes(src);
              return (
                <button
                  key={src}
                  onClick={() => onToggleSource && onToggleSource(src)}
                  className={cn(
                    'transition-all opacity-60 hover:opacity-100 scale-95 hover:scale-100',
                    active && 'opacity-100 scale-105 ring-2 ring-indigo-500/40 rounded-md'
                  )}
                >
                  <SourceIcon source={src} showLabel={true} />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Author filter */}
            <div className="flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={authorFilter || ''}
                onChange={(e) => onAuthorChange && onAuthorChange(e.target.value)}
                placeholder="Filter by Author..."
                className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Date Range filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={dateRange || 'all'}
                onChange={(e) => onDateRangeChange && onDateRangeChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
              >
                <option value="all">Anytime</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
