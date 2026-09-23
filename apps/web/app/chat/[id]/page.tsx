import React from 'react';
import { ChatContainerView } from '../../../components/ChatContainerView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DynamicChatPage({ params }: PageProps) {
  const resolvedParams = await params;
  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden">
      <ChatContainerView initialThreadId={resolvedParams.id} />
    </div>
  );
}
