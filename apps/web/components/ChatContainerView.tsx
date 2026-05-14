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
} from 'lucide-react';
import { Message, SourceType, SearchResult, Action } from '@nexus/types';
import { MessageBubble, SourceSelector, SourceIcon } from '@nexus/ui';

interface ChatContainerViewProps {
  initialThreadId?: string;
}

// Seed mock threads
const mockThreadsData: Record<string, { title: string; messages: Message[] }> = {
  'thread-1': {
    title: 'Authentication gateway token rotation review',
    messages: [
      {
        id: 'msg-u1',
        role: 'user',
        content: 'Can you summarize recent blocked Slack threads regarding the authentication gateway migrations?',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: 'msg-a1',
        role: 'assistant',
        content: 'I analyzed your unread internal Slack channels (#product-strategy, #engineering-leads) and identified 2 blocked threads regarding authentication flows. I have successfully summarized the key decisions and generated tracking Jira tasks.',
        timestamp: new Date(Date.now() - 14 * 60 * 1000),
        searchResults: [
          {
            id: 'res-slack-1',
            title: 'Slack Thread: #product-strategy',
            snippet: 'Discussed timeline constraints for the Nexus dashboard overhaul. Decision: push mock backends live for staging preview.',
            source: 'slack',
            relevanceScore: 0.94,
            url: 'https://slack.com',
            createdAt: '15 mins ago',
            author: 'Sarah Jenkins (PM)',
          },
        ],
        actions: [
          {
            type: 'jira_ticket',
            status: 'completed',
            result: {
              message: 'Created Ticket NEX-1042: Implement Glassmorphic Frontend Shell',
              details: 'Assigned to Frontend Team • Priority: Critical',
              url: 'https://jira.acme.corp',
            },
          },
        ],
      },
    ],
  },
  'thread-2': {
    title: 'Figma visual layout workspace export synchronization',
    messages: [
      {
        id: 'msg-u2',
        role: 'user',
        content: 'Show me design files updated last week in Google Drive',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000),
      },
      {
        id: 'msg-a2',
        role: 'assistant',
        content: 'I scanned the connected Google Drive volumes. Here are the active UI design assets blueprints modified during the last work week:\n\n```typescript\nexport interface ScannedAsset {\n  filename: string;\n  byteSize: number;\n}\n```\n\nTrigger automated access requests below.',
        timestamp: new Date(Date.now() - 2.9 * 3600 * 1000),
        searchResults: [
          {
            id: 'res-drive-2',
            title: 'Figma Assets Export - Sprint Layouts',
            snippet: 'Includes high-fidelity preview exports of the sidebar navigation system.',
            source: 'drive',
            relevanceScore: 0.98,
            url: 'https://drive.google.com',
            createdAt: '3 hours ago',
            author: 'Elena Rostova',
          },
        ],
      },
    ],
  },
  'thread-3': {
    title: 'Webhook backoff policies integration test setup',
    messages: [
      {
        id: 'msg-u3',
        role: 'user',
        content: 'Fixing dropping Slack webhook deliveries queue logic',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        id: 'msg-a3',
        role: 'assistant',
        content: 'Observed intermittent dropouts during peak concurrent Slack synchronizations. Propose injecting Redis-based task queues to re-attempt delivery 3 times prior to flagging as failed action status.',
        timestamp: new Date(Date.now() - 23.9 * 3600 * 1000),
      },
    ],
  },
};

export function ChatContainerView({ initialThreadId }: ChatContainerViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams?.get('prompt') || '';

  const [threads, setThreads] = useState([
    { id: 'thread-1', title: 'Authentication gateway token rotation review', time: '12 mins ago' },
    { id: 'thread-2', title: 'Figma visual layout workspace export synchronization', time: '3 hours ago' },
    { id: 'thread-3', title: 'Webhook backoff policies integration test setup', time: 'Yesterday' },
  ]);

  const currentActiveThread = initialThreadId ? mockThreadsData[initialThreadId] : null;

  const [messages, setMessages] = useState<Message[]>(
    currentActiveThread?.messages || [
      {
        id: 'welcome-init',
        role: 'assistant',
        content: "Hello! I am **Nexus Assistant**, your autonomous enterprise data connector. I have full read/write access scopes configured across your Slack, Notion, GitHub, Google Drive, and Jira layers.\n\nHow can I streamline your workload today?",
        timestamp: new Date(),
      },
    ]
  );

  const [input, setInput] = useState('');
  const [selectedScope, setSelectedScope] = useState<SourceType[]>(['slack', 'notion', 'github', 'drive', 'jira']);
  const [isStreaming, setIsStreaming] = useState(false);
  const [, startTransition] = useTransition();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestedPrompts = [
    'Summarize my unread Slack threads and create Jira tickets for action items.',
    'Show me design files updated last week in Google Drive and Notion.',
    'Scan documentation for Next.js 15 routing gateway errors.',
  ];

  // Scroll smoothly to latest buffer outputs
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Execute parameter prompt on mount if available
  useEffect(() => {
    if (initialPrompt && messages.length <= 1 && !isStreaming) {
      setInput(initialPrompt);
      // clean parameter mapping
      router.replace('/chat');
      // trigger dispatch after short state settle
      setTimeout(() => {
        handleSubmitQuery(initialPrompt);
      }, 100);
    }
  }, [initialPrompt]);

  const handleConfirmAction = (msgId: string, actionIdx: number) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.actions) {
          const updatedActions = [...m.actions];
          updatedActions[actionIdx] = {
            ...updatedActions[actionIdx],
            status: 'completed',
            result: {
              ...updatedActions[actionIdx].result,
              message: updatedActions[actionIdx].result?.message || 'Confirmed trigger execution',
              details: 'Manual verification confirmed payload pipeline.',
            },
          };
          return { ...m, actions: updatedActions };
        }
        return m;
      })
    );
  };

  const handleSubmitQuery = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isStreaming) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    const placeholderAssistantId = `assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: placeholderAssistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    // Update messages array
    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInput('');
    setIsStreaming(true);

    // Reset textarea sizes
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          scope: selectedScope,
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
                  } else if (parsed.type === 'actions') {
                    return {
                      ...msg,
                      actions: parsed.data,
                    };
                  }
                }
                return msg;
              })
            );
          } catch (e) {
            // malformed chunk line bypass
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderAssistantId
            ? { ...msg, content: '⚠️ Disconnected from streaming response orchestrator. Please verify active backend endpoints.' }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);

      // Create tracking sidebar history list element if creating new session
      if (!initialThreadId && messages.length <= 2) {
        setThreads((prev) => [
          {
            id: `thread-${Date.now()}`,
            title: textToSend.slice(0, 45) + (textToSend.length > 45 ? '...' : ''),
            time: 'Just now',
          },
          ...prev,
        ]);
      }
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

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl overflow-hidden shadow-sm">
      {/* Left pane: Threads memory list sidebar */}
      <div className="w-72 border-r border-slate-200 dark:border-slate-800/60 flex flex-col hidden lg:flex bg-slate-50/40 dark:bg-slate-900/20">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            History Threads
          </span>
          <button
            onClick={() => router.push('/chat')}
            className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {threads.map((t) => {
            const isCurrent = initialThreadId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => startTransition(() => router.push(`/chat/${t.id}`))}
                className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 group ${
                  isCurrent
                    ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs font-semibold'
                    : 'hover:bg-white/50 dark:hover:bg-slate-900/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className={`text-xs truncate ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {t.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 pl-5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {t.time}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main interaction screen partition */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Superior stream header tag */}
        <div className="h-12 border-b border-slate-100 dark:border-slate-800/60 px-4 flex items-center justify-between shrink-0 bg-white/40 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              {currentActiveThread ? currentActiveThread.title : 'Active Dialog Agent'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400">Stream Buffer Channel: Secured</span>
          </div>
        </div>

        {/* Message bubble stream scroll panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              const isAssistantTyping = isStreaming && isLastMessage && msg.role === 'assistant';

              return (
                <MessageBubble
                  key={msg.id || index}
                  message={msg}
                  isTyping={isAssistantTyping}
                  onConfirmAction={(actionIdx) => handleConfirmAction(msg.id, actionIdx)}
                />
              );
            })}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input parameters container */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md space-y-3 shrink-0">
          {/* Suggested quick starter Prompt tags */}
          {messages.length <= 2 && !isStreaming && (
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Suggested Prompts:
              </span>
              {suggestedPrompts.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(sug);
                    if (textareaRef.current) textareaRef.current.focus();
                  }}
                  className="text-left max-w-xs truncate text-[11px] px-2.5 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg border border-slate-200/60 dark:border-slate-800 transition-all font-medium"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Scope integrations multiselect selector array */}
          <SourceSelector selectedSources={selectedScope} onChange={setSelectedScope} />

          {/* Prompt textarea composite bar */}
          <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleTextareaInput}
              rows={1}
              placeholder="Ask Nexus Assistant anything... (Press Enter to dispatch)"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-44 leading-relaxed"
            />

            <button
              onClick={() => handleSubmitQuery()}
              disabled={!input.trim() || isStreaming}
              className={`p-2.5 rounded-xl transition-all shrink-0 ${
                input.trim() && !isStreaming
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 scale-100'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed scale-95'
              }`}
              title="Dispatch message payload"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              RAG real-time augmentations automatically inject document distances.
            </span>
            <span className="hidden sm:flex items-center gap-0.5">
              <span>Press Enter</span>
              <CornerDownLeft className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
