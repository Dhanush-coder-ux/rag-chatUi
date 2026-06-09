// components/ChatLayout.tsx — VAATHI OS Shell
import React, { useState, useCallback, useRef } from 'react';
import { Sidebar }         from './Sidebar';
import { ChatHeader }      from './ChatHeader';
import { MessageList }     from './MessageList';
import { ChatInput }       from './ChatInput';
import { Dashboard }       from './Dashboard';
import { DropZoneOverlay } from './FileUploadButton';
import { useFileUpload }   from '../hooks/useFileUpload';
import { Message, SourceItem } from '../types';
import { useRagContext }   from '../context/RagContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeId  = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const nowDate = () => new Date();

function stepToIcon(step: string): 'search' | 'web' | 'brain' {
  if (step.includes('🌐') || step.toLowerCase().includes('web'))  return 'web';
  if (step.includes('📄') || step.toLowerCase().includes('doc'))  return 'search';
  return 'brain';
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ChatLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { messages, setMessages, askQuestionStream, sessionLoading } = useRagContext();
  const streamingIdRef = useRef<string | null>(null);
  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileUpload();

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);

  const patchMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev: Message[]) =>
      prev.map(m => m.id === id ? { ...m, ...patch } : m),
    );
  }, []);

  const handleSubmit = useCallback(async (question: string) => {
    const userMsg: Message = {
      id:        makeId(),
      role:      'user',
      content:   question,
      timestamp: nowDate(),
    };
    const assistantId = makeId();
    const assistantMsg: Message = {
      id:           assistantId,
      role:         'assistant',
      content:      '',
      timestamp:    nowDate(),
      streamStatus: 'streaming',
      tools:        [],
    };
    streamingIdRef.current = assistantId;
    setMessages((prev: Message[]) => [...prev, userMsg, assistantMsg]);

    await askQuestionStream(question, {
      onStep: (step) => {
        setMessages((prev: Message[]) => prev.map(m => {
          if (m.id !== assistantId) return m;
          const existing = m.tools ?? [];
          const finished = existing.map(t => ({ ...t, status: 'done' as const }));
          return {
            ...m,
            tools: [
              ...finished,
              { id: makeId(), label: step, icon: stepToIcon(step), status: 'running' as const },
            ],
          };
        }));
      },
      onChunk: (token) => {
        setMessages((prev: Message[]) => prev.map(m =>
          m.id === assistantId ? { ...m, content: m.content + token } : m,
        ));
      },
      onSources: (sources: SourceItem[]) => {
        patchMessage(assistantId, { sources });
      },
      onToolUsed: (toolUsed) => {
        setMessages((prev: Message[]) => prev.map(m => {
          if (m.id !== assistantId) return m;
          const existing = m.tools ?? [];
          return {
            ...m,
            tools: [
              ...existing.map(t => ({ ...t, status: 'done' as const })),
              {
                id:     makeId(),
                label:  typeof toolUsed === 'string' ? toolUsed : String(toolUsed),
                icon:   stepToIcon(typeof toolUsed === 'string' ? toolUsed : ''),
                status: 'done' as const,
              },
            ],
          };
        }));
      },
      onTraceId: (traceId) => {
        patchMessage(assistantId, { traceId });
      },
      onDone: () => {
        setMessages((prev: Message[]) => prev.map(m => {
          if (m.id !== assistantId) return m;
          return {
            ...m,
            streamStatus: 'done',
            tools: (m.tools ?? []).map(t => ({ ...t, status: 'done' as const })),
          };
        }));
        streamingIdRef.current = null;
      },
      onError: () => {
        patchMessage(assistantId, { isError: true, streamStatus: 'done', content: '' });
        streamingIdRef.current = null;
      },
    });
  }, [askQuestionStream, patchMessage]);

  const handleRegenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setMessages((prev: Message[]) => prev.filter((_, i) => i < prev.length - 1));
    handleSubmit(lastUser.content);
  }, [messages, handleSubmit]);

  const showDashboard = messages.length === 0 && !sessionLoading;

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ background: '#020617' }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ── Ambient Background Effects ─────────────────────────────────────── */}
      {/* Subtle grid */}
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />

      {/* Floating glow orbs */}
      <div className="glow-orb-1" />
      <div className="glow-orb-2" />

      {/* Scan-line overlay */}
      <div className="scan-line-overlay fixed inset-0 pointer-events-none z-0" />

      {/* ── Drop Zone Overlay ──────────────────────────────────────────────── */}
      <DropZoneOverlay visible={isDragging} onDrop={() => {}} />

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <main className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative z-10">
        <ChatHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        {/* Content area */}
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          {showDashboard ? (
            <Dashboard />
          ) : (
            <MessageList
              messages={messages}
              onRegenerate={handleRegenerate}
            />
          )}

          <ChatInput onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
};