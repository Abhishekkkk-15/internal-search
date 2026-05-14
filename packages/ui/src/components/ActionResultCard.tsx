import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Action } from '@nexus/types';
import { cn } from '../lib/utils';

interface ActionResultCardProps {
  action: Action;
  className?: string;
  onConfirm?: () => void;
}

export const ActionResultCard: React.FC<ActionResultCardProps> = ({
  action,
  className,
  onConfirm,
}) => {
  const getMeta = (type: Action['type']) => {
    switch (type) {
      case 'jira_ticket':
        return { title: 'Jira Action', label: 'Create Jira Ticket' };
      case 'slack_message':
        return { title: 'Slack Action', label: 'Send Slack Notification' };
      case 'notion_page':
        return { title: 'Notion Action', label: 'Update Notion Knowledgebase' };
      case 'github_issue':
        return { title: 'GitHub Action', label: 'File GitHub Issue' };
      default:
        return { title: 'System Action', label: 'Execute Automation' };
    }
  };

  const meta = getMeta(action.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative my-2 p-3.5 rounded-xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm transition-all',
        action.status === 'pending' && 'border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10',
        action.status === 'completed' && 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10',
        action.status === 'failed' && 'border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/10',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {action.status === 'pending' && (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            )}
            {action.status === 'completed' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            {action.status === 'failed' && (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {meta.title}
              </span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded font-medium',
                  action.status === 'pending' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                  action.status === 'completed' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  action.status === 'failed' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                )}
              >
                {action.status}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
              {action.result?.message || meta.label}
            </p>

            {action.result?.details && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 bg-white/40 dark:bg-slate-800/40 p-2 rounded-md border border-slate-200/50 dark:border-slate-700/50 font-mono">
                {action.result.details}
              </p>
            )}

            {action.result?.url && (
              <a
                href={action.result.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 font-medium"
              >
                <span>View Generated Asset</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {action.status === 'pending' && onConfirm && (
          <button
            onClick={onConfirm}
            className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow transition-colors"
          >
            Confirm Action
          </button>
        )}
      </div>
    </motion.div>
  );
};
