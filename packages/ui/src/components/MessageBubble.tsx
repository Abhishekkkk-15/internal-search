import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Sparkles, Copy, Check, ExternalLink } from 'lucide-react';
import { Message, SearchResult } from '@nexus/types';
import { cn } from '../lib/utils';
import { SourceIcon } from './SourceIcon';
import { ActionResultCard } from './ActionResultCard';

interface MessageBubbleProps {
  message: Message;
  isTyping?: boolean;
  onConfirmAction?: (actionIndex: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isTyping = false,
  onConfirmAction,
}) => {
  const isUser = message.role === 'user';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Simple and highly robust code block and paragraph parser
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const parts = content.split(/(```[a-zA-Z]*\n[\s\S]*?\n```)/g);

    return parts.map((part, partIndex) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const header = lines[0].replace('```', '').trim() || 'code';
        const codeContent = lines.slice(1, -1).join('\n');

        return (
          <div key={partIndex} className="my-3 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 shadow-md">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <span>{header}</span>
              <button
                onClick={() => handleCopy(codeContent, partIndex)}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                title="Copy code"
              >
                {copiedIndex === partIndex ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 font-sans text-[10px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="font-sans text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Render standard text with simple paragraph breaks
      return (
        <div key={partIndex} className="space-y-2">
          {part.split('\n\n').map((paragraph, pIndex) => {
            if (!paragraph.trim()) return null;
            return (
              <p key={pIndex} className="leading-relaxed whitespace-pre-wrap break-words text-sm">
                {paragraph}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3.5 py-4 px-2 sm:px-4 rounded-2xl group transition-colors',
        isUser ? 'flex-row-reverse' : 'bg-slate-50/50 dark:bg-slate-900/30'
      )}
    >
      {/* Avatar shrink-0 */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border',
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400/30'
            : 'bg-gradient-to-br from-slate-800 to-slate-950 text-indigo-400 border-slate-700/50'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Main bubble body */}
      <div className={cn('flex-1 max-w-[85%] sm:max-w-[75%]', isUser && 'text-right')}>
        <div className="flex items-center gap-2 mb-1 justify-start" style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isUser ? 'You' : 'Nexus Assistant'}
          </span>
          {!isUser && <Sparkles className="w-3 h-3 text-indigo-500" />}
          <span className="text-[10px] text-slate-400">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Formatted Content */}
        <div className={cn('text-slate-800 dark:text-slate-100', isUser && 'bg-indigo-600 text-white inline-block text-left px-4 py-2.5 rounded-2xl rounded-tr-none shadow-sm')}>
          {renderFormattedContent(message.content)}

          {isTyping && (
            <div className="flex items-center gap-1.5 mt-2 py-1 px-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-full inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[10px] text-slate-500 font-medium ml-1">Thinking...</span>
            </div>
          )}
        </div>

        {/* Embedded RAG Search Results */}
        {message.searchResults && message.searchResults.length > 0 && (
          <div className="mt-3.5 space-y-2 text-left">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block tracking-wide uppercase">
              Relevant Knowledge References
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.searchResults.map((result: SearchResult) => (
                <a
                  key={result.id}
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl border bg-white/80 dark:bg-slate-950/50 hover:border-indigo-500/40 transition-all flex flex-col justify-between block group/card"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <SourceIcon source={result.source} showLabel={false} />
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded">
                        {Math.round(result.relevanceScore * 100)}% match
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover/card:text-indigo-500 transition-colors">
                      {result.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {result.snippet}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                    <span>By {result.author}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Embedded Automated Action Previews/Confirmations */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3.5 space-y-2 text-left">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block tracking-wide uppercase">
              Triggered Automated Actions
            </span>
            {message.actions.map((act, idx) => (
              <ActionResultCard
                key={idx}
                action={act}
                onConfirm={
                  onConfirmAction && act.status === 'pending'
                    ? () => onConfirmAction(idx)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
