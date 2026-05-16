'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
} from 'lucide-react';
import { SourceIcon, StatusBadge } from '@nexus/ui';
import { SourceType } from '@nexus/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

const API_BASE = 'http://localhost:3002/api';

// Predefined static config for display purposes
const staticConfigs: Record<SourceType, { interval: string; description: string }> = {
  slack: {
    interval: '15m',
    description: 'Indexes direct messages, channel threads, and active shared PDF specifications.',
  },
  notion: {
    interval: '1h',
    description: 'Indexes product requirements docs, engineering guides, and database rows.',
  },
  github: {
    interval: '1h',
    description: 'Indexes main branch repository readmes, issues tracker, and pull requests.',
  },
  drive: {
    interval: '24h',
    description: 'Indexes shared slide presentation slides, spreadsheets, and design models.',
  },
  jira: {
    interval: 'manual',
    description: 'Enables automatic filing of backlog tickets and syncs current epic progress.',
  },
};

export default function ConnectionsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const orgId = session?.user?.organizationId || 'org_default';

  // Fetch real connection states from the Express backend
  const { data: dbConnections, isLoading } = useQuery({
    queryKey: ['integrations', orgId],
    queryFn: async () => {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${API_BASE}/integrations`, {
        headers: { 
          'X-Organization-Id': orgId,
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch integrations');
      const json = await res.json();
      return json.data as Array<any>;
    },
    enabled: !!session?.user,
  });

  // Disconnect Mutation
  const disconnectMutation = useMutation({
    mutationFn: async (source: SourceType) => {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${API_BASE}/integrations/${source}/disconnect`, {
        method: 'POST',
        headers: { 
          'X-Organization-Id': orgId,
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', orgId] });
    }
  });

  const handleDisconnect = (src: SourceType) => {
    const confirmDelete = window.confirm(`Are you absolutely sure you want to revoke OAuth credentials for ${src.toUpperCase()}? This clears cached RAG index tensors.`);
    if (!confirmDelete) return;
    disconnectMutation.mutate(src);
  };

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${API_BASE}/integrations/sync`, {
        method: 'POST',
        headers: { 
          'X-Organization-Id': orgId,
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to start sync');
      return res.json();
    }
  });

  const handleTriggerManualSync = () => {
    syncMutation.mutate();
    alert('Sync job triggered in the background. Documents will appear as they are embedded.');
  };

  const handleStartOauthFlow = (src: SourceType) => {
    // Navigate directly to the backend OAuth initialization route
    window.location.href = `${API_BASE}/integrations/${src}/connect?orgId=${orgId}`;
  };

  const sourcesList: SourceType[] = ['slack', 'notion', 'github', 'drive', 'jira'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Integration Engine Handshakes</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Enterprise Integration Gateways
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Nexus Assistant uses encrypted short-lived delegated tokens to index company repositories securely. Configure targeted ingestion rates or force flush index buffers below.
        </p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sourcesList.map((src, idx) => {
          // Merge static config with DB data
          const dbConn = dbConnections?.find(c => c.source === src);
          const status = dbConn?.status || 'disconnected';
          const indexedCount = dbConn?.indexedCount || 0;
          const lastSync = dbConn?.lastSync ? new Date(dbConn.lastSync).toLocaleString() : 'Never indexed';
          const config = staticConfigs[src];

          return (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-6 rounded-2xl border bg-white/60 dark:bg-slate-950/60 backdrop-blur-md flex flex-col justify-between space-y-5 transition-all ${
                status === 'connected'
                  ? 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/30'
                  : 'border-slate-200/40 dark:border-slate-800/40 opacity-80'
              }`}
            >
              {/* Card top banner */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <SourceIcon source={src} showLabel={true} className="scale-105 origin-top-left" />
                  <StatusBadge status={status as any} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[32px]">
                  {config.description}
                </p>
              </div>

              {/* Data payload telemetries section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Indexed Items:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {isLoading ? '...' : indexedCount.toLocaleString()} items
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Last Refresh:</span>
                  <span className="text-slate-600 dark:text-slate-400 italic text-[10px]">
                    {isLoading ? '...' : lastSync}
                  </span>
                </div>
              </div>

              {/* Actions footer options */}
              <div className="pt-1 flex items-center justify-between gap-2">
                {status === 'disconnected' ? (
                  <button
                    onClick={() => handleStartOauthFlow(src)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Connect Account</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleTriggerManualSync}
                      disabled={syncMutation.isPending}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200/60 dark:border-slate-800"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin text-amber-500' : ''}`} />
                      <span>{syncMutation.isPending ? 'Syncing...' : 'Manual Sync'}</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(src)}
                      disabled={disconnectMutation.isPending}
                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl transition-colors border border-rose-100 dark:border-rose-900/40 disabled:opacity-50"
                      title="Revoke connection credentials"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
