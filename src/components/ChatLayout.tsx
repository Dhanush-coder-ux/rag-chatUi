// components/ChatLayout.tsx — VAATHI OS Shell
import React, { useState, useCallback, useRef } from 'react';
import { Sidebar }         from './Sidebar';
import { ChatHeader }      from './ChatHeader';
import { MessageList }     from './MessageList';
import { ChatInput }       from './ChatInput';
import { Dashboard }       from './Dashboard';
import { DropZoneOverlay } from './FileUploadButton';
import { KnowledgeBasePage } from './KnowledgeBasePage';
import { useFileUpload }   from '../hooks/useFileUpload';
import { useRagContext }   from '../context/RagContext';
import { useVoiceWebSocket } from '../hooks/useVoiceWebSocket';
import { Message, SourceItem } from '../types';

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
  const [sidebarOpen, setSidebarOpen]             = useState(true);
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const { messages, setMessages, askQuestionStream, sessionLoading, mode, model, selectedDocumentIds, sessionId, fetchSessions } = useRagContext();
  const streamingIdRef = useRef<string | null>(null);
  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileUpload();

  const { isRecording, isProcessing, statusText, startRecording, stopRecording } = useVoiceWebSocket();

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
      onModelUsed: (modelUsed) => {
        patchMessage(assistantId, { modelUsed });
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

  const handleStartVoice = () => {
    const userMsg: Message = { id: makeId(), role: 'user', content: '...', timestamp: nowDate() };
    const assistantId = makeId();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: nowDate(), streamStatus: 'streaming', tools: [] };
    
    setMessages((prev: Message[]) => [...prev, userMsg, assistantMsg]);
    
    startRecording(
      sessionId || null,
      mode,
      model,
      selectedDocumentIds,
      messages.map(m => ({ role: m.role, content: m.content })),
      (text) => { patchMessage(userMsg.id, { content: text }); },
      (chunkStr) => {
         // handle rag chunk (same format as askQuestionStream)
         if (chunkStr.startsWith("event: step") || chunkStr.startsWith("event: trace") || chunkStr.startsWith("event: mode") || chunkStr.startsWith("event: sources") || chunkStr.startsWith("event: tool_used") || chunkStr.startsWith("event: model_used")) {
            // Very simplified parsing for voice mode
            if (chunkStr.startsWith("event: sources")) {
               try {
                 const payload = chunkStr.split("data:")[1].trim();
                 patchMessage(assistantId, { sources: JSON.parse(payload) });
               } catch(e) {}
            }
         } else if (chunkStr.includes("data:")) {
            const payload = chunkStr.split("data:")[1].trim();
            if (payload && payload !== "[DONE]") {
               try {
                  const parsed = JSON.parse(payload);
                  const token = typeof parsed === 'string' ? parsed : parsed.answer || parsed.content || '';
                  setMessages((prev: Message[]) => prev.map(m => m.id === assistantId ? { ...m, content: m.content + token } : m));
               } catch(e) {
                  setMessages((prev: Message[]) => prev.map(m => m.id === assistantId ? { ...m, content: m.content + payload } : m));
               }
            }
         }
      },
      (id) => { fetchSessions(); }
    );
  };

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
        onOpenKnowledgeBase={() => setKnowledgeBaseOpen(true)}
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

          <ChatInput 
            onSubmit={handleSubmit} 
            isRecording={isRecording}
            isProcessing={isProcessing}
            startRecording={handleStartVoice}
            stopRecording={stopRecording}
            statusText={statusText}
          />
        </div>
      </main>

      {/* ── Knowledge Base full-page overlay ─────────────────────────────────── */}
      {knowledgeBaseOpen && (
        <KnowledgeBasePage onClose={() => setKnowledgeBaseOpen(false)} />
      )}
    </div>
  );
};