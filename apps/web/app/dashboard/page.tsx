'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Zap,
  Database,
  MessageSquare,
  FolderSync,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { StatusBadge, SourceIcon } from '@nexus/ui';
import { SourceType } from '@nexus/types';

export default function DashboardPage() {
  const router = useRouter();

  // Mock analytic stats
  const stats = [
    { title: 'Connected Sources', value: '5 Platforms', change: '+1 this week', icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { title: 'Recent Queries', value: '1,428', change: '+18% vs last week', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Actions Executed', value: '384', change: '94% automated', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Success Rate', value: '99.2%', change: '0.8% failure queue', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  // Recharts analytic graph values
  const chartData = [
    { day: 'Mon', queries: 120, actions: 45 },
    { day: 'Tue', queries: 210, actions: 80 },
    { day: 'Wed', queries: 180, actions: 65 },
    { day: 'Thu', queries: 290, actions: 110 },
    { day: 'Fri', queries: 340, actions: 140 },
    { day: 'Sat', queries: 150, actions: 30 },
    { day: 'Sun', queries: 138, actions: 24 },
  ];

  // Quick Action triggers
  const quickActions = [
    {
      title: 'Summarize unread Slack',
      description: 'Scan primary Slack engineering channels and draft summary task tickets.',
      prompt: 'Summarize my unread Slack threads and create Jira tickets for action items.',
      icon: MessageSquare,
      bg: 'hover:border-purple-500/40 hover:bg-purple-50/20 dark:hover:bg-purple-950/10',
    },
    {
      title: 'Scan Drive for new docs',
      description: 'Index high-fidelity design prototypes and release specifications.',
      prompt: 'Show me design files updated last week in Google Drive and Notion.',
      icon: FolderSync,
      bg: 'hover:border-blue-500/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/10',
    },
    {
      title: 'Create weekly report',
      description: 'Compile unread matrix pull requests and generate broadcast reports.',
      prompt: 'Summarize recent workspace developments and generate markdown status reports.',
      icon: Activity,
      bg: 'hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10',
    },
  ];

  // Recent threads
  const recentConversations = [
    { id: 'thread-1', title: 'Authentication gateway token rotation review', platform: 'slack' as SourceType, time: '12 mins ago', preview: 'Analyzed internal rate limits and generated tasks...' },
    { id: 'thread-2', title: 'Figma visual layout workspace export synchronization', platform: 'drive' as SourceType, time: '3 hours ago', preview: 'Extracted 5 platform file components into database buffer...' },
    { id: 'thread-3', title: 'Webhook backoff policies integration test setup', platform: 'jira' as SourceType, time: 'Yesterday', preview: 'Configured Redis exponential task queues...' },
  ];

  // Connection sync matrices
  const syncStatuses: { source: SourceType; status: 'connected' | 'syncing' | 'error' }[] = [
    { source: 'slack', status: 'connected' },
    { source: 'notion', status: 'connected' },
    { source: 'github', status: 'syncing' },
    { source: 'drive', status: 'connected' },
    { source: 'jira', status: 'connected' },
  ];

  const executeQuickAction = (prompt: string) => {
    router.push(`/chat?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10 backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-20 pointer-events-none">
          <Sparkles className="w-48 h-48 text-indigo-500" />
        </div>

        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide border border-indigo-100 dark:border-indigo-900">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nexus Active Core v2.4</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back to <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Nexus Assistant</span>
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            Your centralized multi-modal operational brain is fully synced. Query documentation, generate automated Jira/Slack dispatch actions, or search vector databases instantly.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
            >
              <span>New Natural Query</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-all"
            >
              <span>Explore Data Vector Graph</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, i) => {
          const IconComponent = st.icon;
          return (
            <motion.div
              key={st.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
                  {st.title}
                </span>
                <div className={`p-2 rounded-xl ${st.bg} ${st.color}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {st.value}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {st.change}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Middle Workspace: Analytics Charts & Sync telemetry Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Area Analytics Graph */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Nexus Queries & Triggers Volume
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aggregated deep graph queries processed over past 7 days
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Queries
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Automated Actions
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="queryColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="actionColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#queryColor)" />
                <Area type="monotone" dataKey="actions" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#actionColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live sync telemetries indicators dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md flex flex-col justify-between space-y-4"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Source Synchronization Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live heartbeat telemetry buffers monitoring RAG targets
            </p>
          </div>

          <div className="space-y-3.5 my-auto">
            {syncStatuses.map((st) => (
              <div key={st.source} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <SourceIcon source={st.source} showLabel={true} />
                <StatusBadge status={st.status} />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 text-center">
            <Link
              href="/connections"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Enterprise Connections</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Lower section: Quick action shortcuts & Recent conversation history threads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions stack */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Quick Prompt Automations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              One-click execute deep assistant pipelines
            </p>
          </div>

          <div className="space-y-3">
            {quickActions.map((act) => {
              const ActIcon = act.icon;
              return (
                <button
                  key={act.title}
                  onClick={() => executeQuickAction(act.prompt)}
                  className={`w-full text-left p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm transition-all group block ${act.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors shrink-0">
                      <ActIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {act.title}
                        </h4>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                        {act.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Active Conversations list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Recent Workspace Dialogues
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Resume recent RAG lookups and workflow evaluations
            </p>
          </div>

          <div className="space-y-3">
            {recentConversations.map((thread) => (
              <Link
                key={thread.id}
                href={`/chat/${thread.id}`}
                className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm hover:border-indigo-500/30 transition-all flex items-start justify-between gap-4 group block"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SourceIcon source={thread.platform} showLabel={false} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {thread.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 pl-1">
                    {thread.preview}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0 pt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{thread.time}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
