'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  Network,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Building2,
  Sun,
  Moon,
  User,
  Sparkles,
  ChevronDown,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useNexusStore } from '../lib/store';
import { cn } from '@nexus/ui';

export function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    sidebarExpanded,
    toggleSidebar,
    currentOrg,
    setOrg,
    theme,
    toggleTheme,
  } = useNexusStore();

  const [mounted, setMounted] = useState(false);
  const [showOrgDrop, setShowOrgDrop] = useState(false);
  const [showAuthDrop, setShowAuthDrop] = useState(false);
  const session = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync class dark state to standard HTML DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Chat Assistant', href: '/chat', icon: MessageSquare, exact: false },
    { name: 'Hybrid Search', href: '/search', icon: Search },
    { name: 'Connections', href: '/connections', icon: Network },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const orgsList = [
    'Acme Corp (Enterprise)',
    'Global Logistics Dev',
    'Nexus Research Beta',
  ];

  return (
    <div className="flex min-h-screen relative z-10">
      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl transition-all duration-300',
          sidebarExpanded ? 'w-64' : 'w-20'
        )}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-indigo-100" />
            </div>
            {sidebarExpanded && (
              <div className="flex flex-col truncate animate-in fade-in duration-200">
                <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white flex items-center gap-1">
                  Nexus <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">AI</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Enterprise RAG</span>
              </div>
            )}
          </Link>

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
          >
            {sidebarExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation block */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact === false ? pathname.startsWith('/chat') : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-medium transition-all group relative',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100')} />
                {sidebarExpanded && <span className="truncate">{item.name}</span>}

                {/* Left active mini-indicator stripe */}
                {isActive && !sidebarExpanded && (
                  <span className="absolute left-1 top-2 bottom-2 w-1 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer scope status badge preview */}
        {sidebarExpanded && mounted && (
          <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20 border border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Workspace Buffer</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2">
              Sync active • 5 external platforms fully indexed
            </p>
          </div>
        )}
      </aside>

      {/* Main interface layout container */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          sidebarExpanded ? 'pl-64' : 'pl-20'
        )}
      >
        {/* Superior Glass Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          {/* Active section title context */}
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-800 dark:text-white capitalize tracking-wide">
              {pathname === '/' ? 'Dashboard' : pathname.replace('/', '').split('/')[0]}
            </h1>
          </div>

          {/* User actions block */}
          <div className="flex items-center gap-3">
            {/* Organization Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowOrgDrop(!showOrgDrop)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="hidden sm:inline max-w-[120px] truncate">{mounted ? currentOrg : 'Loading...'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showOrgDrop && mounted && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in duration-150">
                  <span className="block px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Switch Active Matrix
                  </span>
                  {orgsList.map((org) => (
                    <button
                      key={org}
                      onClick={() => {
                        setOrg(org);
                        setShowOrgDrop(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between',
                        currentOrg === org ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/40 dark:bg-indigo-950/20' : 'text-slate-600 dark:text-slate-300'
                      )}
                    >
                      <span className="truncate">{org}</span>
                      {currentOrg === org && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
              title="Toggle theme view"
            >
              {mounted && theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {/* User Avatar Circular Status Badge */}
            <div className="relative flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowAuthDrop(!showAuthDrop)}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-indigo-950 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center text-white dark:text-slate-900 font-bold text-xs shadow-inner ring-2 ring-indigo-500/20 overflow-hidden hover:ring-indigo-500 transition-all shrink-0"
                title={session.data?.user?.name || 'Unauthenticated Session'}
              >
                {session.data?.user?.image ? (
                  <img src={session.data.user.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </button>

              {showAuthDrop && (
                <div className="absolute right-0 top-10 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in duration-150">
                  {/* Identity metadata banner */}
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="block font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                      {session.data?.user?.name || 'Guest User'}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-400 truncate">
                      {session.data?.user?.email || 'Not authenticated'}
                    </span>
                    <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                      {session.status === 'authenticated' ? 'NextAuth Verified' : 'Local Preview'}
                    </span>
                  </div>

                  {/* Actions mapping */}
                  <div className="py-1">
                    {session.status === 'authenticated' ? (
                      <button
                        onClick={() => {
                          signOut();
                          setShowAuthDrop(false);
                        }}
                        className="w-full px-4 py-2 text-xs text-left text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    ) : (
                      <>
                        <span className="block px-4 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-400">
                          OAuth Identity Links
                        </span>
                        <button
                          onClick={() => {
                            signIn('github');
                            setShowAuthDrop(false);
                          }}
                          className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                          <LogIn className="w-3.5 h-3.5 text-slate-400" />
                          Sign in with GitHub
                        </button>
                        <button
                          onClick={() => {
                            signIn('google');
                            setShowAuthDrop(false);
                          }}
                          className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                          <LogIn className="w-3.5 h-3.5 text-slate-400" />
                          Sign in with Google
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content view screen */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
