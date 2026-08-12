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
  FileText
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { StatusBadge, SourceIcon } from '@nexus/ui';
import { SourceType } from '@nexus/types';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

const API_BASE = 'http://localhost:3002/api';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id || 'user_default';

  // Fetch real dynamic analytics from Express backend
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics', userId],
    queryFn: async () => {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${API_BASE}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId
        }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    enabled: !!session?.user
  });

  const connectedSourcesCount = analyticsData?.stats?.connectedSourcesCount || 0;
  const indexedDocumentsCount = analyticsData?.stats?.indexedDocumentsCount || 0;
  const conversationsCount = analyticsData?.stats?.conversationsCount || 0;
  const messagesCount = analyticsData?.stats?.messagesCount || 0;

  // Dynamic Dashboard Stats
  const stats = [
    { title: 'Connected Sources', value: `${connectedSourcesCount} Platforms`, change: 'Slack, Notion, GitHub', icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { title: 'Indexed Documents', value: `${indexedDocumentsCount}`, change: 'Vector & Full-text Indexed', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Chat Conversations', value: `${conversationsCount}`, change: `${messagesCount} user messages`, icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'System Status', value: '100%', change: 'All services operational', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  // Analytic graph values (default or live)
  const chartData = analyticsData?.chartData || [
    { day: 'Mon', queries: 0, actions: 0 },
    { day: 'Tue', queries: 0, actions: 0 },
    { day: 'Wed', queries: 0, actions: 0 },
    { day: 'Thu', queries: 0, actions: 0 },
    { day: 'Fri', queries: 0, actions: 0 },
    { day: 'Sat', queries: 0, actions: 0 },
    { day: 'Sun', queries: 0, actions: 0 },
  ];

  // Quick Action triggers targeting Slack, Notion, GitHub
  const quickActions = [
    {
      title: 'Search Recent Slack Discussions',
      description: 'Find discussion threads, team updates, and messages across Slack channels.',
      prompt: 'Summarize recent discussions and updates from Slack.',
      icon: MessageSquare,
      bg: 'hover:border-purple-500/40 hover:bg-purple-50/20 dark:hover:bg-purple-950/10',
    },
    {
      title: 'Scan Notion Docs & Specs',
      description: 'Search product requirements, engineering guides, and documentation.',
      prompt: 'What are the main engineering specs and docs available in Notion?',
      icon: FolderSync,
      bg: 'hover:border-blue-500/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/10',
    },
    {
      title: 'Review GitHub Issues & PRs',
      description: 'Scan open pull requests, bug reports, and code updates on GitHub.',
      prompt: 'Summarize recent GitHub issues and pull requests in our repositories.',
      icon: Activity,
      bg: 'hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10',
    },
  ];

  // Recent threads
  const recentConversations = analyticsData?.recentConversations || [];

  // Connection sync statuses
  const syncStatuses = analyticsData?.connections || [];

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

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Your unified internal search engine is active across connected Slack, Notion, and GitHub repositories.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/chat')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Start New Chat</span>
            </button>
            <button
              onClick={() => router.push('/search')}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-indigo-500" />
              <span>Explore Documents</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.title}</span>
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{stat.change}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Analytics Graph & Quick Triggers Partition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recharts 7-Day Activity Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                7-Day Query Activity
              </h3>
              <p className="text-[11px] text-slate-400">Total search queries executed by day</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 font-semibold">
              Live Feed
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#queryGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quick Action Triggers */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Action Triggers
            </h3>
            <p className="text-[11px] text-slate-400">Launch standard prompts directly into Chat Assistant</p>
          </div>

          <div className="space-y-3 py-2">
            {quickActions.map((qa, idx) => {
              const Icon = qa.icon;
              return (
                <button
                  key={idx}
                  onClick={() => executeQuickAction(qa.prompt)}
                  className={`w-full text-left p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/40 dark:bg-slate-900/40 ${qa.bg} transition-all group flex items-start justify-between gap-3`}
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{qa.title}</span>
                    </span>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{qa.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
                </button>
              );
            })}
          </div>

          <Link
            href="/chat"
            className="w-full py-2.5 px-4 text-center rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-slate-800 text-xs font-semibold transition-all block"
          >
            Open Full Chat Workspace →
          </Link>
        </div>
      </div>

      {/* Bottom Partition: Recent Threads & Connections Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Recent Conversations
            </h3>
            <Link href="/chat" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentConversations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <MessageSquare className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p>No recent conversations logged yet.</p>
                <Link href="/chat" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Start your first chat thread</Link>
              </div>
            ) : (
              recentConversations.map((rc: any) => (
                <Link
                  key={rc.id}
                  href={`/chat/${rc.id}`}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {rc.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{rc.preview}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-3">
                    {new Date(rc.time).toLocaleDateString()}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Integration Sync Status */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              Connected Platform Status
            </h3>
            <Link href="/connections" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>Manage Connections</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {['slack', 'notion', 'github'].map((src) => {
              const conn = syncStatuses.find((c: any) => c.source === src);
              const isConnected = conn?.status === 'connected';
              return (
                <div
                  key={src}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60"
                >
                  <div className="flex items-center gap-3">
                    <SourceIcon source={src as SourceType} showLabel={false} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{src}</h4>
                      <p className="text-[10px] text-slate-400">
                        {isConnected ? `${conn?.indexedCount || 0} items indexed` : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={isConnected ? 'connected' : 'disconnected'} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
