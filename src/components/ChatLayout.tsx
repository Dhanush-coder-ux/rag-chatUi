import React, { useState, useCallback, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { DropZoneOverlay } from './FileUploadButton';

import { useFileUpload } from '../hooks/useFileUpload';

import { Message } from '../types';
import { useRagContext } from '../context/RagContext';

export const ChatLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { chatHistory } = useRagContext() 
  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileUpload();

  // Bridge the gap between backend HistoryMessage and frontend Message
  const uiMessages = useMemo<Message[]>(() => {
    return (chatHistory ?? []).map((msg, index) => ({
      ...msg,
      id: `msg-${index}`, 
      timestamp: new Date(), 
    } as Message));
  }, [chatHistory]);

  return (
    <div
      className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <DropZoneOverlay visible={isDragging} onDrop={() => {}} />

      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onOpen={() => setSidebarOpen(true)} 
      />

      <main className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative transition-all duration-300">
        <ChatHeader />

        <div className="flex flex-col flex-1 overflow-hidden">
          <MessageList messages={uiMessages} />
          <ChatInput />
        </div>
      </main>
    </div>
  );
};