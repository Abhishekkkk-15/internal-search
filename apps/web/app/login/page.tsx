'use client';

import React, { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Github } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-10 shadow-2xl shadow-slate-900/10 space-y-8 relative z-10"
      >
        {/* Brand Logo & Title Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 mb-1">
            <Sparkles className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Internal Search <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">AI</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            Sign in to access unified RAG search across your connected Slack, Notion, and GitHub documents.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2 text-left pt-1">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Role-based Vectors
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Real-time RAG
            </span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="w-full py-3.5 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-3 group active:scale-98"
          >
            <Github className="w-5 h-5" />
            <span>Continue with GitHub</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full py-3.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-xs flex items-center justify-center gap-3 group active:scale-98"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-slate-400">
          By signing in, you agree to enterprise access permissions and data security standards.
        </p>
      </motion.div>
    </div>
  );
}
