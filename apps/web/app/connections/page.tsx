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

  // Schedule Mutation
  const scheduleMutation = useMutation({
    mutationFn: async ({ source, schedule }: { source: SourceType; schedule: string | null }) => {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${API_BASE}/integrations/schedule`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ source, schedule })
      });
      if (!res.ok) throw new Error('Failed to update schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', orgId] });
    }
  });

  const handleScheduleChange = (src: SourceType, schedule: string) => {
    scheduleMutation.mutate({ source: src, schedule: schedule === 'manual' ? null : schedule });
  };

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
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl shadow-2xl shadow-indigo-500/5">
        <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-20 pointer-events-none">
          <Sparkles className="w-24 h-24 text-indigo-500" />
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>Integration Engine Handshakes</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Enterprise Integration Gateways
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Nexus Assistant uses encrypted short-lived delegated tokens to index company repositories securely. Configure targeted ingestion rates or force flush index buffers below.
            </p>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Current Tier</div>
            <div className="font-black text-sm uppercase italic tracking-tighter flex items-center gap-1.5">
              {/* @ts-ignore */}
              {session?.user?.plan === 'pro' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  PRO
                </>
              ) : (
                'FREE'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sourcesList.map((src, idx) => {
          // Merge static config with DB data
          const dbConn = dbConnections?.find(c => c.source === src);
          const status = dbConn?.status || 'disconnected';
          const indexedCount = dbConn?.indexedCount || 0;
          const lastSync = dbConn?.lastSync ? new Date(dbConn.lastSync).toLocaleString() : 'Never indexed';
          const currentSchedule = dbConn?.syncSchedule || 'manual';
          const config = staticConfigs[src];

          return (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`group relative p-7 rounded-[2rem] border bg-white/60 dark:bg-slate-950/60 backdrop-blur-md flex flex-col justify-between space-y-6 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 ${
                status === 'connected'
                  ? 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40'
                  : 'border-slate-200/40 dark:border-slate-800/40 opacity-80'
              }`}
            >
              {/* Card top banner */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition-transform duration-500">
                    <SourceIcon source={src} showLabel={true} className="scale-110" />
                  </div>
                  <StatusBadge status={status as any} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {config.description}
                </p>
              </div>

              {/* Data payload telemetries section */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Indexed Items</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {isLoading ? '...' : indexedCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Last Refresh</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                      {isLoading ? '...' : lastSync}
                    </span>
                  </div>
                </div>

                {status === 'connected' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sync Frequency</label>
                    <select
                      value={currentSchedule}
                      onChange={(e) => handleScheduleChange(src, e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="manual">Manual Only</option>
                      <option value="0 * * * *">Hourly</option>
                      <option value="0 0 * * *">Daily at Midnight</option>
                      <option value="0 0 * * 0">Weekly on Sundays</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions footer options */}
              <div className="pt-2 flex items-center justify-between gap-3">
                {status === 'disconnected' ? (
                  <button
                    onClick={() => handleStartOauthFlow(src)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Establish Connection</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleTriggerManualSync}
                      disabled={syncMutation.isPending}
                      className="flex-1 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-800 active:scale-[0.98] disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin text-indigo-500' : ''}`} />
                      <span>{syncMutation.isPending ? 'Queuing...' : 'Sync Now'}</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(src)}
                      disabled={disconnectMutation.isPending}
                      className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl transition-all border border-rose-500/20 active:scale-[0.98] disabled:opacity-50"
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
