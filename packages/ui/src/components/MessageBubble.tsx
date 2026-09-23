import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bot,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark,
  FileText,
  MessageSquare,
  Github,
  Quote,
} from 'lucide-react';
import { Message, SearchResult, Action } from '@nexus/types';
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
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);

  const handleCopyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Helper for citation badge source icon and color
  const getCitationMeta = (rawBadge: string) => {
    const lower = rawBadge.toLowerCase();
    if (lower.includes('notion')) {
      return {
        icon: FileText,
        color: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-300/60 dark:border-amber-700/50',
      };
    }
    if (lower.includes('slack')) {
      return {
        icon: MessageSquare,
        color: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-300/60 dark:border-purple-700/50',
      };
    }
    if (lower.includes('github')) {
      return {
        icon: Github,
        color: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-300/60 dark:border-slate-700/50',
      };
    }
    return {
      icon: Bookmark,
      color: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/50',
    };
  };

  // Inline Markdown parser for citations, links, bold, italic, code
  const formatInlineMarkdown = (text: string) => {
    const tokenRegex = /(\[Source\s+\d+(?:\s*-\s*[A-Za-z]+)?\]|https?:\/\/[^\s\)\>\]]+|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = text.split(tokenRegex);

    return parts.map((subPart, subIdx) => {
      // Citation badge: [Source 1 - NOTION] or [Source 1]
      if (/^\[Source\s+\d+/.test(subPart)) {
        const meta = getCitationMeta(subPart);
        const Icon = meta.icon;
        const cleanLabel = subPart.replace(/^\[|\]$/g, '');

        // Try extracting source number for linking
        const matchNumber = cleanLabel.match(/\d+/);
        const sourceIndex = matchNumber ? parseInt(matchNumber[0], 10) - 1 : null;

        return (
          <button
            key={subIdx}
            type="button"
            onClick={() => {
              if (message.searchResults && sourceIndex !== null && message.searchResults[sourceIndex]) {
                setHighlightedSourceId(message.searchResults[sourceIndex].id);
                setSourcesExpanded(true);
              }
            }}
            className={cn(
              'inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold border transition-all hover:scale-105 active:scale-95 shadow-2xs align-middle cursor-pointer',
              meta.color
            )}
            title="Click to view reference details"
          >
            <Icon className="w-2.5 h-2.5 shrink-0" />
            <span>{cleanLabel}</span>
          </button>
        );
      }

      // Web URLs
      if (/^https?:\/\//.test(subPart)) {
        return (
          <a
            key={subIdx}
            href={subPart}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mx-0.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline font-medium break-all"
          >
            <span>{subPart}</span>
            <ExternalLink className="w-3 h-3 inline shrink-0" />
          </a>
        );
      }

      // Bold text
      if (/^\*\*[^*]+\*\*$/.test(subPart)) {
        return (
          <strong key={subIdx} className="font-bold text-slate-900 dark:text-white">
            {subPart.slice(2, -2)}
          </strong>
        );
      }

      // Italic text
      if (/^\*[^*]+\*$/.test(subPart)) {
        return (
          <em key={subIdx} className="italic text-slate-700 dark:text-slate-300">
            {subPart.slice(1, -1)}
          </em>
        );
      }

      // Inline code
      if (/^`[^`]+`$/.test(subPart)) {
        return (
          <code
            key={subIdx}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-medium border border-slate-200/60 dark:border-slate-700/60"
          >
            {subPart.slice(1, -1)}
          </code>
        );
      }

      return subPart;
    });
  };

  // Structured Markdown renderer
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const parts = content.split(/(```[a-zA-Z]*\n[\s\S]*?\n```)/g);

    return parts.map((part, partIndex) => {
      // Code Block
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const header = lines[0].replace('```', '').trim() || 'code';
        const codeContent = lines.slice(1, -1).join('\n');
        const lineCount = lines.slice(1, -1).length;

        return (
          <div
            key={partIndex}
            className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md text-left"
          >
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/80" />
                <span className="font-semibold text-slate-300 uppercase">{header}</span>
                <span className="text-[10px] text-slate-500">• {lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(codeContent, partIndex)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all active:scale-95"
                title="Copy code"
              >
                {copiedCodeIndex === partIndex ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-sans text-[10px] font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-sans text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed select-text">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Text paragraphs & headings & lists
      return (
        <div key={partIndex} className="space-y-3">
          {part.split('\n\n').map((paragraph, pIndex) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            // Headings H1, H2, H3
            if (/^#{1,4}\s+/.test(trimmed)) {
              const level = trimmed.match(/^(#{1,4})\s+/)?.[1].length || 2;
              const text = trimmed.replace(/^#{1,4}\s+/, '');
              if (level === 1) {
                return (
                  <h2 key={pIndex} className="text-lg font-black text-slate-900 dark:text-white pt-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-1">
                    {formatInlineMarkdown(text)}
                  </h2>
                );
              }
              if (level === 2) {
                return (
                  <h3 key={pIndex} className="text-base font-bold text-slate-900 dark:text-white pt-1.5">
                    {formatInlineMarkdown(text)}
                  </h3>
                );
              }
              return (
                <h4 key={pIndex} className="text-sm font-semibold text-slate-900 dark:text-slate-100 pt-1">
                  {formatInlineMarkdown(text)}
                </h4>
              );
            }

            // Blockquote
            if (trimmed.startsWith('>')) {
              const quoteText = trimmed.replace(/^>\s*/gm, '');
              return (
                <blockquote
                  key={pIndex}
                  className="pl-3.5 py-1 border-l-2 border-indigo-500/60 dark:border-indigo-400/60 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-r-lg text-slate-700 dark:text-slate-300 italic text-sm my-2 flex items-start gap-2"
                >
                  <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5 opacity-60" />
                  <div>{formatInlineMarkdown(quoteText)}</div>
                </blockquote>
              );
            }

            // Bullet List (- or *)
            if (trimmed.split('\n').every((line) => /^\s*[-*•]\s+/.test(line))) {
              return (
                <ul key={pIndex} className="space-y-1.5 my-1.5 pl-5 list-disc text-sm marker:text-indigo-500">
                  {trimmed.split('\n').map((line, lIdx) => {
                    const cleanLine = line.replace(/^\s*[-*•]\s+/, '');
                    return <li key={lIdx} className="leading-relaxed">{formatInlineMarkdown(cleanLine)}</li>;
                  })}
                </ul>
              );
            }

            // Numbered List (1. 2. 3.)
            if (trimmed.split('\n').every((line) => /^\s*\d+\.\s+/.test(line))) {
              return (
                <ol key={pIndex} className="space-y-1.5 my-1.5 pl-5 list-decimal text-sm marker:text-indigo-500 marker:font-semibold">
                  {trimmed.split('\n').map((line, lIdx) => {
                    const cleanLine = line.replace(/^\s*\d+\.\s+/, '');
                    return <li key={lIdx} className="leading-relaxed">{formatInlineMarkdown(cleanLine)}</li>;
                  })}
                </ol>
              );
            }

            // Standard Paragraph
            return (
              <p key={pIndex} className="leading-relaxed whitespace-pre-wrap break-words text-sm">
                {formatInlineMarkdown(trimmed)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const hasSources = Boolean(message.searchResults && message.searchResults.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3 sm:gap-4 py-3 sm:py-4 px-2 sm:px-4 rounded-2xl group transition-all',
        isUser
          ? 'flex-row-reverse'
          : 'bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 shadow-xs'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-all mt-0.5',
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400/30 ring-2 ring-indigo-500/10'
            : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-indigo-400 border-indigo-500/20 ring-2 ring-indigo-500/10'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-300" />}
      </div>

      {/* Main message bubble content */}
      <div className={cn('flex-1 min-w-0 max-w-[88%] sm:max-w-[80%]', isUser && 'text-right')}>
        {/* Header line */}
        <div
          className="flex items-center gap-2 mb-1.5 justify-start"
          style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}
        >
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {isUser ? 'You' : 'Nexus Assistant'}
          </span>
          {!isUser && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              AI
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {/* Quick copy message button */}
          {!isUser && message.content && (
            <button
              type="button"
              onClick={handleCopyMessage}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] flex items-center gap-1"
              title="Copy response"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 text-[9px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[9px]">Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Message body container */}
        <div
          className={cn(
            'text-slate-800 dark:text-slate-100 text-left',
            isUser &&
              'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2.5 rounded-2xl rounded-tr-none shadow-md shadow-indigo-600/10 inline-block font-normal'
          )}
        >
          {renderFormattedContent(message.content)}

          {/* Typing/Streaming indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 mt-3 py-1.5 px-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/50 rounded-xl inline-flex animate-pulse">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-spin" />
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Searching & synthesizing knowledge...
              </span>
            </div>
          )}
        </div>

        {/* Embedded RAG Search References */}
        {hasSources && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-left space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                <span>Referenced Sources ({message.searchResults!.length})</span>
                {sourcesExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              <span className="text-[10px] text-slate-400 font-mono">
                {message.searchResults!.length} matched docs
              </span>
            </div>

            {/* Display first 2 sources by default, or all if expanded */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {(sourcesExpanded ? message.searchResults! : message.searchResults!.slice(0, 2)).map(
                (result: SearchResult, sIdx: number) => {
                  const isHighlighted = highlightedSourceId === result.id;
                  const matchPct = Math.round((result.relevanceScore || 0) * 100);

                  return (
                    <a
                      key={result.id || sIdx}
                      href={result.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'p-3 rounded-xl border bg-white dark:bg-slate-950/70 transition-all flex flex-col justify-between group/card shadow-2xs hover:shadow-sm hover:border-indigo-500/50',
                        isHighlighted
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/30'
                          : 'border-slate-200/70 dark:border-slate-800/80'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <SourceIcon source={result.source} showLabel={true} />
                          <span
                            className={cn(
                              'text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border',
                              matchPct >= 70
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                            )}
                          >
                            {matchPct}% match
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors">
                          {result.title || 'Untitled Document'}
                        </h5>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {result.snippet}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-900 text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[140px]">
                          {result.author ? `By ${result.author}` : 'Synced Doc'}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover/card:text-indigo-500 transition-colors shrink-0" />
                      </div>
                    </a>
                  );
                }
              )}
            </div>

            {message.searchResults!.length > 2 && (
              <button
                type="button"
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold pt-1 block"
              >
                {sourcesExpanded
                  ? 'Show fewer sources ▲'
                  : `+ View ${message.searchResults!.length - 2} more sources ▼`}
              </button>
            )}
          </div>
        )}

        {/* Embedded Action Confirmations */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3.5 space-y-2 text-left">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block tracking-wide uppercase">
              Triggered Automated Actions
            </span>
            {message.actions.map((act: Action, idx: number) => (
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
