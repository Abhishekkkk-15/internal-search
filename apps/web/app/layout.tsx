import React from 'react';
import type { Metadata } from 'next';
import { QueryProvider } from '../lib/query-provider';
import { ClientLayoutShell } from '../components/ClientLayoutShell';
import { SessionProviderWrapper } from '../components/SessionProviderWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nexus Assistant • RAG Enterprise Search & Automation',
  description: 'Connected internal assistant querying Slack, Notion, GitHub, Google Drive, and Jira workflows with triggered auto-actions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-400 min-h-screen relative overflow-x-hidden">
        {/* Ambient premium glowing visual background elements */}
        <div className="bg-orb-1" />
        <div className="bg-orb-2" />

        <SessionProviderWrapper>
          <QueryProvider>
            <ClientLayoutShell>{children}</ClientLayoutShell>
          </QueryProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
