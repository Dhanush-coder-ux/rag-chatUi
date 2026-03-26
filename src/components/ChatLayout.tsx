import React, { useState, useCallback, useRef } from 'react';
import { Sidebar }        from './Sidebar';
import { ChatHeader }     from './ChatHeader';
import { MessageList }    from './MessageList';
import { ChatInput }      from './ChatInput';
import { DropZoneOverlay } from './FileUploadButton';
import { useFileUpload }  from '../hooks/useFileUpload';
import { Message, SourceItem } from '../types';
import { useRagContext }  from '../context/RagContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeId  = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const nowDate = () => new Date();

// Map pipeline step label → ToolUse icon
function stepToIcon(step: string): 'search' | 'web' | 'brain' {
  if (step.includes('🌐') || step.toLowerCase().includes('web'))      return 'web';
  if (step.includes('📄') || step.toLowerCase().includes('doc'))      return 'search';
  return 'brain';
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ChatLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const streamingIdRef = useRef<string | null>(null);

  const { askQuestionStream } = useRagContext();
  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileUpload();

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);

  // ── Patch a streaming message in place ──────────────────────────────────
  const patchMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, ...patch } : m),
    );
  }, []);

  // ── Submit handler (lifted from ChatInput) ───────────────────────────────
  const handleSubmit = useCallback(async (question: string) => {
    // 1. Append user message
    const userMsg: Message = {
      id:        makeId(),
      role:      'user',
      content:   question,
      timestamp: nowDate(),
    };

    // 2. Create empty assistant placeholder
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
    setMessages(prev => [...prev, userMsg, assistantMsg]);

    // 3. Stream
    await askQuestionStream(question, {
      onStep: (step) => {
        patchMessage(assistantId, {
          tools: [
            // Mark previous tools done, add new running one
            // We accumulate by label so duplicates don't pile up
          ],
        });
        // Simpler: append as a ToolUse entry
        setMessages(prev => prev.map(m => {
          if (m.id !== assistantId) return m;
          const existing = m.tools ?? [];
          // Mark all previous as done
          const finished = existing.map(t => ({ ...t, status: 'done' as const }));
          return {
            ...m,
            tools: [
              ...finished,
              {
                id:     makeId(),
                label:  step,
                icon:   stepToIcon(step),
                status: 'running' as const,
              },
            ],
          };
        }));
      },

      onChunk: (token) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: m.content + token }
            : m,
        ));
      },

      onSources: (sources: SourceItem[]) => {
        patchMessage(assistantId, { sources });
      },

      onToolUsed: (toolUsed) => {
        setMessages(prev => prev.map(m => {
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
        // Mark all tools done, close stream
        setMessages(prev => prev.map(m => {
          if (m.id !== assistantId) return m;
          return {
            ...m,
            streamStatus: 'done',
            tools: (m.tools ?? []).map(t => ({ ...t, status: 'done' as const })),
          };
        }));
        streamingIdRef.current = null;
      },

      onError: (err) => {
        patchMessage(assistantId, {
          isError:      true,
          streamStatus: 'done',
          content:      '',
        });
        streamingIdRef.current = null;
      },
    });
  }, [askQuestionStream, patchMessage]);

  // ── Regenerate last assistant message ────────────────────────────────────
  const handleRegenerate = useCallback(() => {
    // Find last user message
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    // Remove last assistant message and re-ask
    setMessages(prev => prev.filter((_, i) => i < prev.length - 1));
    handleSubmit(lastUser.content);
  }, [messages, handleSubmit]);

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

      <main className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative">
        <ChatHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <div className="flex flex-col flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            onRegenerate={handleRegenerate}
          />
          {/* onSubmit is now owned here, not inside ChatInput */}
          <ChatInput onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
};