// components/ChatLayout.tsx — VAATHI OS Shell
import React, { useState, useCallback, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Dashboard } from './Dashboard';
import { DropZoneOverlay } from './FileUploadButton';
import { KnowledgeBasePage } from './KnowledgeBasePage';
import { useFileUpload } from '../hooks/useFileUpload';
import { useRagContext } from '../context/RagContext';
import { useVoiceLiveChat } from '../hooks/useVoiceLiveChat';
import { Message, SourceItem } from '../types';
import { VoiceLiveModal } from './VoiceLiveModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const nowDate = () => new Date();

function stepToIcon(step: string): 'search' | 'web' | 'brain' {
  if (step.includes('🌐') || step.toLowerCase().includes('web')) return 'web';
  if (step.includes('📄') || step.toLowerCase().includes('doc')) return 'search';
  return 'brain';
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ChatLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const [liveModeOpen, setLiveModeOpen] = useState(false);

  const {
    messages, setMessages, askQuestionStream,
    sessionLoading, mode, model, selectedDocumentIds,
    sessionId, fetchSessions,
  } = useRagContext();

  const streamingIdRef = useRef<string | null>(null);
  const liveResponseIdRef = useRef<string | null>(null);

  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileUpload();

  // ── Live continuous voice chat ────────────────────────────────────────────
  const {
    phase: livePhase,
    transcript: liveTranscript,
    assistantResponse: liveAssistantResponse,
    statusText: liveStatus,
    audioLevel,
    isActive: liveActive,
    startLiveChat,
    stopLiveChat,
  } = useVoiceLiveChat();

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);

  const patchMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev: Message[]) =>
      prev.map(m => m.id === id ? { ...m, ...patch } : m),
    );
  }, [setMessages]);

  // ── Text chat submit ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (question: string) => {
    const userMsg: Message = {
      id: makeId(), role: 'user', content: question, timestamp: nowDate(),
    };
    const assistantId = makeId();
    const assistantMsg: Message = {
      id: assistantId, role: 'assistant', content: '', timestamp: nowDate(),
      streamStatus: 'streaming', tools: [],
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
      onSources: (sources: SourceItem[]) => { patchMessage(assistantId, { sources }); },
      onToolUsed: (toolUsed) => {
        setMessages((prev: Message[]) => prev.map(m => {
          if (m.id !== assistantId) return m;
          const existing = m.tools ?? [];
          return {
            ...m,
            tools: [
              ...existing.map(t => ({ ...t, status: 'done' as const })),
              {
                id: makeId(),
                label: typeof toolUsed === 'string' ? toolUsed : String(toolUsed),
                icon: stepToIcon(typeof toolUsed === 'string' ? toolUsed : ''),
                status: 'done' as const,
              },
            ],
          };
        }));
      },
      onTraceId: (traceId) => { patchMessage(assistantId, { traceId }); },
      onModelUsed: (modelUsed) => { patchMessage(assistantId, { modelUsed }); },
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
  }, [askQuestionStream, patchMessage, setMessages]);

  const handleRegenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setMessages((prev: Message[]) => prev.filter((_, i) => i < prev.length - 1));
    handleSubmit(lastUser.content);
  }, [messages, handleSubmit, setMessages]);


  // ── Live voice: open JARVIS modal + start conversation ────────────────────
  const handleOpenLiveVoice = useCallback(() => {
    const userMsgId = makeId();
    const assistantId = makeId();
    liveResponseIdRef.current = assistantId;

    const userMsg: Message = {
      id: userMsgId, role: 'user', content: '...', timestamp: nowDate(),
    };
    const assistantMsg: Message = {
      id: assistantId, role: 'assistant', content: '', timestamp: nowDate(),
      streamStatus: 'streaming', tools: [], modelUsed: 'nemotron',
    };
    setMessages((prev: Message[]) => [...prev, userMsg, assistantMsg]);
    setLiveModeOpen(true);

    startLiveChat(
      sessionId || null, mode, model, selectedDocumentIds,
      messages.map(m => ({ role: m.role, content: m.content })),
      {
        onTranscript: (text) => { patchMessage(userMsgId, { content: text }); },
        onResponseChunk: (chunk) => {
          setMessages((prev: Message[]) => prev.map(m =>
            m.id === liveResponseIdRef.current
              ? { ...m, content: m.content + chunk }
              : m
          ));
        },
        onTurnEnd: () => {
          setMessages((prev: Message[]) => prev.map(m =>
            m.id === liveResponseIdRef.current
              ? { ...m, streamStatus: 'done' as const }
              : m
          ));
          fetchSessions();

          // Prepare placeholder pair for the next turn
          const nextUserId = makeId();
          const nextAssistantId = makeId();
          liveResponseIdRef.current = nextAssistantId;
          setMessages((prev: Message[]) => [...prev,
            { id: nextUserId, role: 'user', content: '...', timestamp: nowDate() },
            { id: nextAssistantId, role: 'assistant', content: '', timestamp: nowDate(),
              streamStatus: 'streaming' as const, tools: [], modelUsed: 'nemotron' },
          ]);
        },
        onSessionId: () => { fetchSessions(); },
      }
    );
  }, [sessionId, mode, model, selectedDocumentIds, messages, startLiveChat, patchMessage, setMessages, fetchSessions]);

  const handleCloseLiveVoice = useCallback(() => {
    stopLiveChat();
    setLiveModeOpen(false);
    setMessages((prev: Message[]) => {
      const last = [...prev].reverse().find(m => m.role === 'assistant' && m.streamStatus === 'streaming');
      if (!last) return prev;
      return prev.map(m => m.id === last.id ? { ...m, streamStatus: 'done' as const } : m);
    });
  }, [stopLiveChat, setMessages]);

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
      {/* Ambient background */}
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="glow-orb-1" />
      <div className="glow-orb-2" />
      <div className="scan-line-overlay fixed inset-0 pointer-events-none z-0" />

      <DropZoneOverlay visible={isDragging} onDrop={() => {}} />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        onOpenKnowledgeBase={() => setKnowledgeBaseOpen(true)}
      />

      <main className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative z-10">
        <ChatHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          {showDashboard ? (
            <Dashboard />
          ) : (
            <MessageList messages={messages} onRegenerate={handleRegenerate} />
          )}

          {/* ChatInput — the cyan live voice button is INSIDE the input bar */}
          <ChatInput
            onSubmit={handleSubmit}
            onStartLiveVoice={handleOpenLiveVoice}
            isLiveActive={liveActive}
          />
        </div>
      </main>

      {/* Knowledge Base overlay */}
      {knowledgeBaseOpen && (
        <KnowledgeBasePage onClose={() => setKnowledgeBaseOpen(false)} />
      )}

      {/* JARVIS Live Voice Modal */}
      <VoiceLiveModal
        isOpen={liveModeOpen}
        phase={livePhase}
        transcript={liveTranscript}
        assistantResponse={liveAssistantResponse}
        statusText={liveStatus}
        audioLevel={audioLevel}
        onClose={handleCloseLiveVoice}
      />
    </div>
  );
};