'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  List,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import { SearchBar, SourceIcon, LoadingSkeleton } from '@nexus/ui';
import { SourceType } from '@nexus/types';
import { useSession } from 'next-auth/react';

const API_BASE = 'http://localhost:3002/api';

export interface ExtendedSearchResult {
  id: string;
  title: string;
  content: string;
  snippet?: string;
  source: SourceType;
  rrf_score: number;
  semantic_score: number;
  keyword_score: number;
  url: string;
  createdAt: string;
  author: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');
  const [selectedSources, setSelectedSources] = useState<SourceType[]>(['slack', 'notion', 'github', 'drive', 'jira']);
  const [authorFilter, setAuthorFilter] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const [expandedDoc, setExpandedDoc] = useState<ExtendedSearchResult | null>(null);

  // Toggle selected source
  const handleToggleSource = (src: SourceType) => {
    if (selectedSources.includes(src)) {
      setSelectedSources(selectedSources.filter((s) => s !== src));
    } else {
      setSelectedSources([...selectedSources, src]);
    }
    setPage(1);
  };

  const executeSearch = () => {
    setSearchTrigger(query);
    setPage(1);
  };

  const { data: session } = useSession();
  const organizationId = session?.user?.organizationId || 'org_default';

  // Fetch search items via Real Backend Hybrid Search
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['hybridSearch', searchTrigger, selectedSources, page],
    queryFn: async () => {
      if (!searchTrigger) return { data: [], metadata: { count: 0 } };

      const res = await fetch(`${API_BASE}/chat/search`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
          'X-Organization-Id': organizationId
        },
        body: JSON.stringify({
          query: searchTrigger,
          scope: selectedSources,
        }),
      });
      if (!res.ok) throw new Error('Failed to retrieve search data payload');
      return res.json();
    },
    enabled: !!session?.accessToken,
    placeholderData: (prev) => prev,
  });

  const results: any[] = data?.data || [];
  const totalCount = data?.metadata?.count || 0;
  const totalPages = Math.ceil(totalCount / 10) || 1;

  return (
    <div className="space-y-6">
      {/* Superior Header panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hybrid Search Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Enterprise Content Context Lookups
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Simultaneously evaluates semantic vectors and literal string hashes to pinpoint knowledge graphs.
          </p>
        </div>

        {/* Presentation modes switch */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 self-start md:self-center shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title="Grid presentation layout"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title="List presentation layout"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Searchbar component interface */}
      <div className="relative z-20">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={executeSearch}
          placeholder="Type keyword, title, snippet, or full content search target..."
          selectedSources={selectedSources}
          onToggleSource={handleToggleSource}
          authorFilter={authorFilter}
          onAuthorChange={(a) => {
            setAuthorFilter(a);
            setPage(1);
          }}
          dateRange={dateRange}
          onDateRangeChange={(d) => {
            setDateRange(d);
            setPage(1);
          }}
        />
      </div>

      {/* Context metadata output label */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 pt-2">
        <div>
          {isLoading || isFetching ? (
            <span className="animate-pulse">Retrieving multi-modal embeddings buffer...</span>
          ) : (
            <span>
              Found <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> indexed document nodes matching matrices scopes.
            </span>
          )}
        </div>

        {searchTrigger && (
          <button
            onClick={() => {
              setQuery('');
              setSearchTrigger('');
              setPage(1);
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Clear specific strings
          </button>
        )}
      </div>

      {/* Main output list container */}
      {isLoading ? (
        <LoadingSkeleton type={viewMode === 'grid' ? 'card' : 'search'} count={4} />
      ) : isError ? (
        <div className="p-8 text-center bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            Error processing vector lookups. Please double check backend connectivity proxies.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="p-12 text-center bg-white/40 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl backdrop-blur-sm space-y-3">
          <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching search reference pairs</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your keyword attributes or expand active provider scoping filters above.
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {results.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => setExpandedDoc(doc)}
              className={`p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md hover:border-indigo-500/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                viewMode === 'list' ? 'flex-row sm:items-center sm:justify-between gap-4' : 'h-full space-y-4'
              }`}
            >
              <div className={viewMode === 'list' ? 'flex-1 min-w-0 space-y-2' : 'space-y-3'}>
                <div className="flex items-center justify-between gap-2">
                  <SourceIcon source={doc.source} showLabel={true} />
                  <div className="flex gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60" title="Keyword Match Score">
                      K: {Math.round(Number(doc.keyword_score || 0) * 100)}%
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60" title="Semantic Vector Score">
                      V: {Math.round(Number(doc.semantic_score || 0) * 100)}%
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500 text-white font-bold" title="Fused RRF Rank Score">
                      RRF: {Number(doc.rrf_score || 0).toFixed(3)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {doc.snippet}
                  </p>
                </div>
              </div>

              {/* Sub header details */}
              <div className={`pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0 ${viewMode === 'list' && 'sm:border-t-0 sm:pt-0 sm:flex-col sm:items-end sm:gap-1'}`}>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{doc.author}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{doc.createdAt}</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination control layer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 px-2 border-t border-slate-200/60 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of {totalPages}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Full preview overlay modal backdrop */}
      <AnimatePresence>
        {expandedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header block */}
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <SourceIcon source={expandedDoc.source} showLabel={true} />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500 text-white font-bold">
                      RRF Rank Score: {Number(expandedDoc.rrf_score || 0).toFixed(4)}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      Vector: {Math.round(Number(expandedDoc.semantic_score || 0) * 100)}%
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      Keyword: {Math.round(Number(expandedDoc.keyword_score || 0) * 100)}%
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {expandedDoc.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Indexed: {expandedDoc.createdAt}</span>
                    <span>•</span>
                    <span>Owner: {expandedDoc.author}</span>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedDoc(null)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body raw unescaped preview box */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Extracted Body Snippet
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    &ldquo;{expandedDoc.snippet}&rdquo;
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Full Indexed Content Body
                  </span>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto border border-slate-800">
                    <code>{expandedDoc.fullContent}</code>
                  </pre>
                </div>
              </div>

              {/* Action layout button footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-400 font-medium">
                  Reference id: <code className="font-mono">{expandedDoc.id}</code>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedDoc(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Close Preview
                  </button>
                  <a
                    href={expandedDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <span>Open Upstream Asset</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
