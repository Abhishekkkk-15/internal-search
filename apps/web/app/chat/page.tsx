import React, { Suspense } from 'react';
import { ChatContainerView } from '../../components/ChatContainerView';

export default function ChatPage() {
  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden">
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading chat interface...</div>}>
        <ChatContainerView />
      </Suspense>
    </div>
  );
}
