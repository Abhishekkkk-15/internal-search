'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  Bot,
  Loader2,
  Clock,
  CornerDownLeft,
  Search,
  Zap,
  ShieldCheck,
  FileText,
  Trash2,
  SlidersHorizontal,
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
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId
        }
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const json = await res.json();
      return json.pay as any[];
    },
    enabled: true,
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId || null);
  const [threadSearch, setThreadSearch] = useState('');

  const welcomeMessage: Message = {
    id: 'welcome-init',
    role: 'assistant',
    content: "Hello! I am **Internal Search AI**, your enterprise data search assistant. I can search across your connected Slack, Notion, and GitHub documents.\n\nHow can I help you today?",
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [selectedScope, setSelectedScope] = useState<SourceType[]>(['slack', 'notion', 'github']);
  const [isStreaming, setIsStreaming] = useState(false);
  const [, startTransition] = useTransition();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const heroStarterCards = [
    {
      title: 'Slack DMs & Threads',
      description: 'Summarize unread channel messages and action items',
      prompt: 'Summarize my unread Slack threads and extract action items.',
      icon: MessageSquare,
      color: 'from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20 text-amber-600 dark:text-amber-400 hover:border-amber-500/40',
    },
    {
      title: 'Notion Workspace Docs',
      description: 'Search architecture guides and engineering requirements',
      prompt: 'Search Notion for project design specifications and API docs.',
      icon: FileText,
      color: 'from-blue-500/10 via-cyan-500/5 to-transparent border-blue-500/20 text-blue-600 dark:text-blue-400 hover:border-blue-500/40',
    },
    {
      title: 'GitHub Repos & PRs',
      description: 'Scan recent code commits, issues tracker, and PRs',
      prompt: 'Scan GitHub repository issues for open bug reports and fixes.',
      icon: Zap,
      color: 'from-purple-500/10 via-indigo-500/5 to-transparent border-purple-500/20 text-purple-600 dark:text-purple-400 hover:border-purple-500/40',
    },
  ];

  // Load messages if threadId is provided or reset for new chat
  useEffect(() => {
    setActiveThreadId(initialThreadId || null);
    if (initialThreadId && threadsData) {
      const thread = threadsData.find(t => t.id === initialThreadId);
      if (thread && thread.messages) {
        setMessages(thread.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      }
    } else if (!initialThreadId) {
      setMessages([welcomeMessage]);
    }
  }, [initialThreadId, threadsData]);

  // Scroll smoothly to latest buffer outputs
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleStartNewChat = () => {
    setActiveThreadId(null);
    setMessages([welcomeMessage]);
    setInput('');
    router.push('/chat');
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

    try {
      // @ts-ignore
      const token = session?.accessToken;
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].filter(m => m.id !== 'welcome-init'),
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
            // malformed chunk line bypass
          }
        }
      }

      // Invalidate queries to refresh sidebar
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });

    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderAssistantId
            ? { ...msg, content: '⚠️ Connection lost. Please verify your internet or backend status.' }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
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

  const filteredThreads = threadsData?.filter(t => 
    t.title.toLowerCase().includes(threadSearch.toLowerCase())
  ) || [];

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* 1. Borderless History Threads Sidebar */}
      <div className="w-80 border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col hidden lg:flex bg-slate-50/30 dark:bg-slate-950/30 shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Conversations
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {threadsData?.length || 0}
              </span>
            </div>

            <button
              onClick={handleStartNewChat}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search Filter Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Scrollable Threads List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {threadsLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-xs">Loading conversations...</span>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-indigo-500" />
              <p className="text-xs font-medium">No conversations found</p>
              <p className="text-[10px] text-slate-400">Start a new thread to begin querying your index.</p>
            </div>
          ) : (
            filteredThreads.map((t) => {
              const isCurrent = (initialThreadId || activeThreadId) === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => startTransition(() => router.push(`/chat/${t.id}`))}
                  className={`w-full text-left p-3 rounded-2xl transition-all relative group flex flex-col gap-1 ${
                    isCurrent
                      ? 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-900/50 border border-transparent'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-2 w-full pl-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    <span className={`text-xs truncate font-medium flex-1 ${isCurrent ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                      {t.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pl-6 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    {t.messages && (
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {t.messages.length} msgs
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Borderless Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Superior Control Top Bar */}
        <div className="h-14 border-b border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-8 flex items-center justify-between shrink-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Bot className="w-4 h-4 text-indigo-100" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {activeThreadId ? (threadsData?.find(t => t.id === activeThreadId)?.title || 'Thread Discussion') : 'Internal Search AI Assistant'}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                NVIDIA Llama 3.3-70B • Vector Hybrid RAG
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartNewChat}
              className="lg:hidden p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1"
              title="Start New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMessages([welcomeMessage])}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title="Clear screen view"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Stream View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto py-12 space-y-8 text-center"
            >
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/5">
                <Sparkles className="w-12 h-12 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  What would you like to find today?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Query across your connected Slack channels, Notion wiki pages, and GitHub code repositories in natural language.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {heroStarterCards.map((card, idx) => {
                  const CardIcon = card.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSubmitQuery(card.prompt)}
                      className={`p-5 rounded-2xl border bg-gradient-to-b ${card.color} hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between gap-4 group shadow-sm`}
                    >
                      <div className="flex items-center justify-between">
                        <CardIcon className="w-6 h-6" />
                        <Zap className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
            </motion.div>
          )}

          <div className="max-w-4xl mx-auto space-y-6">
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

        {/* 3. Centered Floating Pill Input Dock */}
        <div className="p-4 sm:pb-6 max-w-4xl mx-auto w-full space-y-3 shrink-0">
          {/* Integration Selector Bar */}
          <div className="flex items-center justify-between px-2">
            <SourceSelector selectedSources={selectedScope} onChange={setSelectedScope} />
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Role-based vector access
            </span>
          </div>

          {/* Floating Textarea Dock Box */}
          <div className="relative flex items-end gap-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-xl shadow-slate-950/5 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleTextareaInput}
              rows={1}
              placeholder="Ask Internal Search AI anything... (Press Enter to send)"
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-44 leading-relaxed font-normal"
            />

            <button
              onClick={() => handleSubmitQuery()}
              disabled={!input.trim() || isStreaming}
              className={`p-3.5 rounded-2xl transition-all shrink-0 font-semibold flex items-center justify-center ${
                input.trim() && !isStreaming
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 active:scale-95'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed scale-95'
              }`}
              title="Send message"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* Keyboard Shortcut & Status Bar */}
          <div className="flex items-center justify-between px-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Real-time vector search augmenting answer generation.
            </span>
            <span className="hidden sm:flex items-center gap-1 font-mono text-[9px] text-slate-400">
              <span>Press Enter ↵ to send</span>
              <span className="opacity-50">•</span>
              <span>Shift + Enter for new line</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
