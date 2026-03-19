import React, { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { DropZoneOverlay } from './FileUploadButton';
import { useChat } from '../context/ChatContext';
import { useFileUpload } from '../hooks/useFileUpload';

export const ChatLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { activeConversation, regenerateLastResponse } = useChat();
  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileUpload();

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);

  return (
    <div
      className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Global drag-and-drop overlay */}
      <DropZoneOverlay visible={isDragging} onDrop={() => {}} />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main panel */}
      <main className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative">
        <ChatHeader onToggleSidebar={toggleSidebar} />

        <div className="flex flex-col flex-1 overflow-hidden">
          <MessageList
            messages={activeConversation?.messages ?? []}
            onRegenerate={regenerateLastResponse}
          />
          <ChatInput />
        </div>
      </main>
    </div>
  );
};
