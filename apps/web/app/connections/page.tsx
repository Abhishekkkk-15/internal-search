'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { SourceIcon, StatusBadge } from '@nexus/ui';
import { SourceType, Connection } from '@nexus/types';

// Predefined default mock connection mapping
const initialConnections: Record<SourceType, Connection & { interval: string; description: string }> = {
  slack: {
    id: 'conn-slack',
    source: 'slack',
    status: 'connected',
    lastSync: '12 mins ago',
    indexedCount: 4280,
    interval: '15m',
    description: 'Indexes direct messages, channel threads, and active shared PDF specifications.',
  },
  notion: {
    id: 'conn-notion',
    source: 'notion',
    status: 'connected',
    lastSync: '2 hours ago',
    indexedCount: 1250,
    interval: '1h',
    description: 'Indexes product requirements docs, engineering guides, and database rows.',
  },
  github: {
    id: 'conn-github',
    source: 'github',
    status: 'syncing',
    lastSync: 'Yesterday',
    indexedCount: 840,
    interval: '1h',
    description: 'Indexes main branch repository readmes, issues tracker, and pull requests.',
  },
  drive: {
    id: 'conn-drive',
    source: 'drive',
    status: 'connected',
    lastSync: 'Just now',
    indexedCount: 9120,
    interval: '24h',
    description: 'Indexes shared slide presentation slides, spreadsheets, and design models.',
  },
  jira: {
    id: 'conn-jira',
    source: 'jira',
    status: 'disconnected',
    lastSync: null,
    indexedCount: 0,
    interval: 'manual',
    description: 'Enables automatic filing of backlog tickets and syncs current epic progress.',
  },
};

export default function ConnectionsPage() {
  const [connections, setConnections] = useState(initialConnections);
  const [oauthModalSource, setOauthModalSource] = useState<SourceType | null>(null);
  const [isSimulatingOauth, setIsSimulatingOauth] = useState(false);
  const [oauthSuccess, setOauthSuccess] = useState(false);

  // Trigger interactive sync simulations per platform
  const [syncingSources, setSyncingSources] = useState<Record<SourceType, boolean>>({
    slack: false,
    notion: false,
    github: false,
    drive: false,
    jira: false,
  });

  const sourcesList: SourceType[] = ['slack', 'notion', 'github', 'drive', 'jira'];

  const handleIntervalChange = (src: SourceType, newInterval: string) => {
    setConnections((prev) => ({
      ...prev,
      [src]: {
        ...prev[src],
        interval: newInterval,
      },
    }));
  };

  const handleTriggerManualSync = async (src: SourceType) => {
    if (connections[src].status === 'disconnected') return;

    setSyncingSources((prev) => ({ ...prev, [src]: true }));
    // update status visual badge indicator
    setConnections((prev) => ({
      ...prev,
      [src]: { ...prev[src], status: 'syncing' },
    }));

    // Simulate realistic processing delay (500-1200ms)
    const latency = Math.floor(Math.random() * 700) + 500;
    await new Promise((r) => setTimeout(r, latency));

    setConnections((prev) => ({
      ...prev,
      [src]: {
        ...prev[src],
        status: 'connected',
        lastSync: 'Just now',
        indexedCount: prev[src].indexedCount + Math.floor(Math.random() * 15) + 2,
      },
    }));
    setSyncingSources((prev) => ({ ...prev, [src]: false }));
  };

  const handleDisconnect = (src: SourceType) => {
    const confirmDelete = window.confirm(`Are you absolutely sure you want to revoke OAuth credentials for ${src.toUpperCase()}? This clears cached RAG index tensors.`);
    if (!confirmDelete) return;

    setConnections((prev) => ({
      ...prev,
      [src]: {
        ...prev[src],
        status: 'disconnected',
        lastSync: null,
        indexedCount: 0,
      },
    }));
  };

  const handleStartOauthFlow = (src: SourceType) => {
    setOauthModalSource(src);
    setIsSimulatingOauth(false);
    setOauthSuccess(false);
  };

  const handleExecuteOauthHandshake = async () => {
    if (!oauthModalSource) return;
    setIsSimulatingOauth(true);

    // Simulate 300-800ms API network routing delays
    const delay = Math.floor(Math.random() * 500) + 300;
    await new Promise((r) => setTimeout(r, delay));

    setOauthSuccess(true);
    setIsSimulatingOauth(false);

    // Automatically transition credentials status buffer
    const updatedSource = oauthModalSource;
    setTimeout(() => {
      setConnections((prev) => ({
        ...prev,
        [updatedSource]: {
          ...prev[updatedSource],
          status: 'connected',
          lastSync: 'Just now',
          indexedCount: Math.floor(Math.random() * 300) + 100,
        },
      }));
      setOauthModalSource(null);
    }, 1200);
  };

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
          const conn = connections[src];
          const isSyncing = syncingSources[src] || conn.status === 'syncing';

          return (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-6 rounded-2xl border bg-white/60 dark:bg-slate-950/60 backdrop-blur-md flex flex-col justify-between space-y-5 transition-all ${
                conn.status === 'connected'
                  ? 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/30'
                  : 'border-slate-200/40 dark:border-slate-800/40 opacity-80'
              }`}
            >
              {/* Card top banner */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <SourceIcon source={src} showLabel={true} className="scale-105 origin-top-left" />
                  <StatusBadge
                    status={conn.status === 'syncing' || isSyncing ? 'syncing' : conn.status}
                    customLabel={isSyncing ? 'Syncing...' : undefined}
                  />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[32px]">
                  {conn.description}
                </p>
              </div>

              {/* Data payload telemetries section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Indexed Items:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {conn.indexedCount.toLocaleString()} items
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Last Refresh:</span>
                  <span className="text-slate-600 dark:text-slate-400 italic">
                    {conn.lastSync || 'Never indexed'}
                  </span>
                </div>

                {/* Interval trigger configuration list dropdown */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Polling:</span>
                  <select
                    value={conn.interval}
                    disabled={conn.status === 'disconnected'}
                    onChange={(e) => handleIntervalChange(src, e.target.value)}
                    className="bg-white dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                  >
                    <option value="15m">Every 15 mins</option>
                    <option value="1h">Hourly</option>
                    <option value="24h">Daily</option>
                    <option value="manual">Manual only</option>
                  </select>
                </div>
              </div>

              {/* Actions footer options */}
              <div className="pt-1 flex items-center justify-between gap-2">
                {conn.status === 'disconnected' ? (
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
                      onClick={() => handleTriggerManualSync(src)}
                      disabled={isSyncing}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 border border-slate-200/60 dark:border-slate-800"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
                      <span>{isSyncing ? 'Flushing...' : 'Manual Sync'}</span>
                    </button>

                    <button
                      onClick={() => handleDisconnect(src)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl transition-colors border border-rose-100 dark:border-rose-900/40"
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

      {/* Simulated OAuth Handshake Gateway Modal Overlay */}
      <AnimatePresence>
        {oauthModalSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-6"
            >
              {/* Header logic */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Authorize Nexus Assistant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connecting platform endpoint matrix scopes to internal workspace tenant.
                </p>
              </div>

              {/* Handshake source container info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <SourceIcon source={oauthModalSource} showLabel={true} />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  OAuth v2.0 Secured
                </span>
              </div>

              {/* Scope approval matrix view */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Requested Permissions Scopes
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Read user metadata & accessible spaces</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Synchronize files, comments, and project items</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Trigger remote dispatches and action webhooks</span>
                  </li>
                </ul>
              </div>

              {/* Status or completion blocks */}
              {oauthSuccess ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-center animate-in fade-in">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Token exchange successful! Initializing indexer...</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOauthModalSource(null)}
                    disabled={isSimulatingOauth}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteOauthHandshake}
                    disabled={isSimulatingOauth}
                    className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {isSimulatingOauth ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Negotiating...</span>
                      </>
                    ) : (
                      <span>Accept & Grant</span>
                    )}
                  </button>
                </div>
              )}

              <div className="text-center">
                <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <span>Simulating 300-800ms API response delays</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
