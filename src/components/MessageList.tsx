import React, { useEffect, useRef, memo, useCallback } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { useRagContext } from '../context/RagContext';

interface Props {
  messages:      Message[];
  onRegenerate?: () => void;
}

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center select-none animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="relative w-16 h-16 group">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 dark:from-violet-500/30 dark:to-indigo-500/30 blur-xl group-hover:blur-2xl transition-all duration-500" />
      <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 transform group-hover:scale-105 transition-transform duration-300 overflow-hidden">
        <img src="/images/vaathi.png" alt="Vaathi Logo" className="w-full h-full object-contain p-2" />
      </div>
    </div>

    <div className="max-w-sm">
      <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2 tracking-tight">
        How can I help you today?
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        Ask questions about your documents, get insights, or explore topics with Vaathi AI.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-4">
      {[
        'Summarize the main document',
        'What are the key findings?',
        'List all action items',
        'Explain this in simple terms',
      ].map((q, i) => (
        <button
          key={q}
          className="px-4 py-3 rounded-xl text-xs font-medium text-left text-zinc-600 dark:text-zinc-300 bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-200 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          style={{ animationDelay: `${i * 100}ms` }}
          onClick={() => {
            const input = document.querySelector<HTMLTextAreaElement>('textarea[data-chat-input]');
            if (!input) return;
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            setter?.call(input, q);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
          }}
        >
          {q}
        </button>
      ))}
    </div>
  </div>
);

// ── Main MessageList ──────────────────────────────────────────────────────────
export const MessageList: React.FC<Props> = memo(({ messages, onRegenerate }) => {
  const { isLoading } = useRagContext();
  const bottomRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrolledUpRef = useRef(false);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    scrolledUpRef.current = el.scrollHeight - el.scrollTop - el.clientHeight > 100;
  }, []);

  useEffect(() => {
    if (!scrolledUpRef.current) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages, isLoading]);

  // When conversation clears, scroll to top
  useEffect(() => {
    if (messages.length === 0) {
      scrolledUpRef.current = false;
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages.length]);

  if (messages.length === 0 && !isLoading) return <EmptyState />;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 relative"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
          >
            <MessageBubble
              message={msg}
              isLast={idx === messages.length - 1}
              onRegenerate={idx === messages.length - 1 ? onRegenerate : undefined}
            />
          </div>
        ))}

        <div ref={bottomRef} className="h-6" aria-hidden="true" />
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';