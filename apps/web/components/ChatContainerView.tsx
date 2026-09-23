'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Square,
  Sparkles,
  Plus,
  MessageSquare,
  Bot,
  Loader2,
  Clock,
  Search,
  Zap,
  ShieldCheck,
  FileText,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  X,
  ArrowDown,
  Github,
  ChevronRight,
  Database,
  Compass,
} from 'lucide-react';
import { Message, SourceType } from '@nexus/types';
import { MessageBubble, SourceSelector } from '@nexus/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

interface ChatContainerViewProps {
  initialThreadId?: string;
}

export function ChatContainerView({ initialThreadId }: ChatContainerViewProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const userId = session?.user?.id || 'user_default';

  // 1. Fetch Conversations (Threads)
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${API_BASE}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': userId,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const json = await res.json();
      return (json.pay || []) as any[];
    },
    enabled: true,
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId || null);
  const [threadSearch, setThreadSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const welcomeMessage: Message = {
    id: 'welcome-init',
    role: 'assistant',
    content:
      "Hello! I am **Nexus Assistant**, your enterprise knowledge and RAG search platform. I can query across your connected **Slack**, **Notion**, and **GitHub** documents with citation-backed answers.\n\nWhat would you like to explore today?",
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [selectedScope, setSelectedScope] = useState<SourceType[]>(['slack', 'notion', 'github']);
  const [isStreaming, setIsStreaming] = useState(false);
  const [, startTransition] = useTransition();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const heroStarterCards = [
    {
      title: 'Slack DMs & Threads',
      description: 'Summarize unread channel messages, decisions, and action items',
      prompt: 'Summarize my recent Slack conversations and extract key action items and decisions.',
      icon: MessageSquare,
      badge: 'Slack',
      color: 'from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 text-purple-600 dark:text-purple-400 hover:border-purple-500/40',
    },
    {
      title: 'Notion Workspace Docs',
      description: 'Search architecture RFCs, product specifications, and API docs',
      prompt: 'Search Notion for project design specifications, technical RFCs, and API documents.',
      icon: FileText,
      badge: 'Notion',
      color: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 text-amber-600 dark:text-amber-400 hover:border-amber-500/40',
    },
    {
      title: 'GitHub Repos & PRs',
      description: 'Scan open bug reports, pull requests, and latest commits',
      prompt: 'Scan our GitHub repositories for open pull requests and critical bug reports.',
      icon: Github,
      badge: 'GitHub',
      color: 'from-slate-500/10 via-indigo-500/5 to-transparent border-slate-500/20 text-slate-700 dark:text-slate-300 hover:border-indigo-500/40',
    },
    {
      title: 'Cross-Source Decisions',
      description: 'Find unified answers indexed across all workplace channels',
      prompt: 'What are the latest decisions made regarding our backend architecture and database schema?',
      icon: Zap,
      badge: 'All Sources',
      color: 'from-indigo-500/10 via-blue-500/5 to-transparent border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500/40',
    },
  ];

  const quickPills = [
    'Recent PR reviews & open issues',
    'Authentication architecture design docs',
    'Customer bug reports in Slack',
    'Summarize team standup notes',
  ];

  // Load messages if threadId changes
  useEffect(() => {
    setActiveThreadId(initialThreadId || null);
    if (initialThreadId && threadsData) {
      const thread = threadsData.find((t) => t.id === initialThreadId);
      if (thread && thread.messages) {
        setMessages(
          thread.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      }
    } else if (!initialThreadId) {
      setMessages([welcomeMessage]);
    }
  }, [initialThreadId, threadsData]);

  // Scroll to bottom smoothly when new messages arrive
  useEffect(() => {
    if (!showScrollBottom) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isStreaming]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 140;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    setShowScrollBottom(false);
  };

  const handleStartNewChat = () => {
    setActiveThreadId(null);
    setMessages([welcomeMessage]);
    setInput('');
    setMobileSidebarOpen(false);
    router.push('/chat');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    try {
      setDeletingThreadId(threadId);
      // @ts-ignore
      const token = session?.accessToken;
      await fetch(`${API_BASE}/chat/conversations/${threadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': userId,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });

      if (activeThreadId === threadId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setDeletingThreadId(null);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSubmitQuery = async (queryOverride?: string) => {
    const queryText = queryOverride || input;
    if (!queryText.trim() || isStreaming) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText.trim(),
      timestamp: new Date(),
    };

    const placeholderAssistantId = `assistant-${Date.now()}`;
    const assistantMsg: Message = {
      id: placeholderAssistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Initialize AbortController for cancelable requests
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // @ts-ignore
      const token = session?.accessToken;
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-User-Id': userId,
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...messages, userMsg].filter((m) => m.id !== 'welcome-init'),
          scope: selectedScope,
          conversationId: initialThreadId || activeThreadId,
        }),
      });

      if (!response.body) throw new Error('No readable stream body returned');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Preserve leftover unparsed snippet chunk
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);

            if (parsed.type === 'meta' && parsed.conversationId) {
              setActiveThreadId(parsed.conversationId);
              if (!initialThreadId) {
                router.replace(`/chat/${parsed.conversationId}`);
              }
            } else {
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id === placeholderAssistantId) {
                    if (parsed.type === 'text') {
                      return {
                        ...msg,
                        content: msg.content + parsed.content,
                      };
                    } else if (parsed.type === 'searchResults') {
                      return {
                        ...msg,
                        searchResults: parsed.data,
                      };
                    }
                  }
                  return msg;
                })
              );
            }
          } catch (e) {
            // Malformed chunk bypass
          }
        }
      }

      // Refresh conversations list in background
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User voluntarily stopped generation
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === placeholderAssistantId && !msg.content
              ? { ...msg, content: '*(Generation stopped by user)*' }
              : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === placeholderAssistantId
              ? { ...msg, content: '⚠️ Connection lost. Please verify your internet or backend status.' }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuery();
    }
  };

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const filteredThreads =
    threadsData?.filter((t) =>
      (t.title || 'Untitled').toLowerCase().includes(threadSearch.toLowerCase())
    ) || [];

  // Group threads by date
  const groupThreadsByDate = (threads: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { [key: string]: any[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    threads.forEach((t) => {
      const date = new Date(t.createdAt);
      if (date >= today) {
        groups.Today.push(t);
      } else if (date >= yesterday) {
        groups.Yesterday.push(t);
      } else if (date >= lastWeek) {
        groups['Previous 7 Days'].push(t);
      } else {
        groups.Older.push(t);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const threadGroups = groupThreadsByDate(filteredThreads);

  // Render Sidebar Content (shared between desktop & mobile)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full min-h-0 bg-slate-50/70 dark:bg-slate-950/70 backdrop-blur-xl select-none">
      {/* Sidebar Header */}
      <div className="p-3.5 space-y-3 border-b border-slate-200/70 dark:border-slate-800/70 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Conversations
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              {threadsData?.length || 0}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleStartNewChat}
              className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
              title="Start a new chat session"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Filter Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={threadSearch}
            onChange={(e) => setThreadSearch(e.target.value)}
            placeholder="Filter conversations..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
          {threadSearch && (
            <button
              type="button"
              onClick={() => setThreadSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Threads List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-4">
        {threadsLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-xs">Loading history...</span>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30 text-indigo-500" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No conversations found
            </p>
            <p className="text-[11px] text-slate-400">
              Start a new session to query your indexed Slack, Notion & GitHub data.
            </p>
          </div>
        ) : (
          threadGroups.map(([groupName, threads]) => (
            <div key={groupName} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                {groupName}
              </span>
              <div className="space-y-0.5 pt-0.5">
                {threads.map((t) => {
                  const isCurrent = (initialThreadId || activeThreadId) === t.id;
                  const isDeleting = deletingThreadId === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setMobileSidebarOpen(false);
                        startTransition(() => router.push(`/chat/${t.id}`));
                      }}
                      className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isCurrent
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                          : 'hover:bg-slate-200/50 dark:hover:bg-slate-900/40 border-transparent text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {/* Left active marker indicator */}
                      {isCurrent && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-r-full" />
                      )}

                      <div className="flex items-center gap-2.5 min-w-0 pr-2 pl-1">
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                            isCurrent
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                          }`}
                        />
                        <div className="min-w-0">
                          <span
                            className={`text-xs block truncate ${
                              isCurrent
                                ? 'text-slate-900 dark:text-white font-bold'
                                : 'font-medium group-hover:text-slate-900 dark:group-hover:text-slate-200'
                            }`}
                          >
                            {t.title || 'Conversation'}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(t.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {t.messages && <span>• {t.messages.length} msgs</span>}
                          </span>
                        </div>
                      </div>

                      {/* Delete conversation action */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, t.id)}
                        disabled={isDeleting}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0"
                        title="Delete conversation"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full max-h-full w-full min-h-0 flex-1 overflow-hidden relative bg-slate-50/50 dark:bg-slate-950">
      {/* 1. Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-white dark:bg-slate-950 shadow-2xl"
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 2. Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 shrink-0 h-full min-h-0 ${
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
        }`}
      >
        {sidebarOpen && renderSidebarContent()}
      </aside>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full max-h-full relative overflow-hidden">
        {/* Top Chat Header */}
        <header className="h-14 border-b border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Sidebar toggle buttons */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title="View conversations"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Active Thread Title & Status */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activeThreadId
                    ? threadsData?.find((t) => t.id === activeThreadId)?.title || 'Discussion Thread'
                    : 'Nexus Internal Search Assistant'}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  NVIDIA Llama 3.3-70B • Vector Hybrid RAG
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartNewChat}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/50 dark:border-indigo-800/50 active:scale-95"
              title="Start a new chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setMessages([welcomeMessage])}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title="Clear screen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Center Chat Messages Stream Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 space-y-6"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Empty / Welcome Hero Display */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8 text-center"
            >
              {/* Glowing Hero Icon */}
              <div className="relative inline-block">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur-lg animate-pulse" />
                <div className="relative inline-flex p-4 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/5">
                  <Sparkles className="w-10 h-10 animate-pulse text-indigo-500" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  What would you like to search?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Query across indexed Slack channels, Notion workspaces, and GitHub repositories with hybrid vector and keyword search.
                </p>
              </div>

              {/* Starter Capability Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
                {heroStarterCards.map((card, idx) => {
                  const CardIcon = card.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSubmitQuery(card.prompt)}
                      className={`p-4 rounded-2xl border bg-gradient-to-b ${card.color} hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col justify-between gap-3 group shadow-2xs text-left`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-2xs border border-slate-200/50 dark:border-slate-800/50">
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60">
                          {card.badge}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {card.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {card.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Prompt Suggestion Pills */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Suggested queries:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {quickPills.map((pill, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleSubmitQuery(pill)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs hover:scale-105 active:scale-95"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages Sequence */}
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const isLastMessage = index === messages.length - 1;
                const isAssistantTyping = isStreaming && isLastMessage && msg.role === 'assistant';

                return (
                  <MessageBubble
                    key={msg.id || index}
                    message={msg}
                    isTyping={isAssistantTyping}
                  />
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={scrollToBottom}
              className="absolute right-6 sm:right-10 bottom-32 z-20 p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-110 active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowDown className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Scroll to bottom</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* 4. Bottom Floating Composer Dock */}
        <div className="p-3 sm:p-5 max-w-4xl mx-auto w-full space-y-2.5 shrink-0 z-10">
          {/* Source Scope Pill Selector */}
          <div className="flex items-center justify-between px-2">
            <SourceSelector selectedSources={selectedScope} onChange={setSelectedScope} />
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              40% similarity threshold filter active
            </span>
          </div>

          {/* Floating Composer Container */}
          <div className="relative flex items-end gap-2 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3 shadow-xl shadow-slate-950/5 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleTextareaInput}
              rows={1}
              placeholder="Ask anything across Slack, Notion & GitHub... (Enter to send)"
              className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-44 leading-relaxed font-normal"
            />

            {/* Action Button: Send or Stop */}
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopStreaming}
                className="p-3 rounded-xl sm:rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold flex items-center justify-center shadow-sm shadow-rose-500/30 transition-all active:scale-95 shrink-0"
                title="Stop response generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmitQuery()}
                disabled={!input.trim()}
                className={`p-3 rounded-xl sm:rounded-2xl transition-all shrink-0 font-semibold flex items-center justify-center ${
                  input.trim()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 active:scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                }`}
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Composer Footer Hints */}
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>Real-time hybrid RAG with reciprocal rank fusion</span>
            </span>
            <span className="hidden sm:flex items-center gap-1 font-mono text-[9px] text-slate-400">
              <span className="font-semibold">Enter ↵</span> to send
              <span className="opacity-40">•</span>
              <span className="font-semibold">Shift + Enter</span> for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
