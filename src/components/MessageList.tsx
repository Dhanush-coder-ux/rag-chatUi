import React, { useEffect, useRef, memo, useCallback } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface Props {
  messages: Message[];
  onRegenerate: () => void;
}

// Empty state splash
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center select-none">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 to-teal-500/20 dark:from-violet-500/30 dark:to-teal-500/30 blur-xl" />
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center shadow-lg">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-8 h-8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    </div>
    <div className="max-w-sm">
      <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
        Start a conversation
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        Ask questions about your documents, get insights, or explore topics with AI-powered search.
      </p>
    </div>
    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
      {[
        'Summarize the main document',
        'What are the key findings?',
        'List all action items',
        'Explain this in simple terms',
      ].map(q => (
        <button
          key={q}
          className="px-3 py-2.5 rounded-xl text-xs text-left text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors leading-snug border border-zinc-200 dark:border-zinc-700"
          onClick={() => {
            const input = document.querySelector<HTMLTextAreaElement>('textarea[data-chat-input]');
            if (input) {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
              nativeInputValueSetter?.call(input, q);
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.focus();
            }
          }}
        >
          {q}
        </button>
      ))}
    </div>
  </div>
);

export const MessageList: React.FC<Props> = memo(({ messages, onRegenerate }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distFromBottom > 100;
  }, []);

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Always scroll to bottom on new conversation
  useEffect(() => {
    userScrolledUpRef.current = false;
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages.length === 0]);

  if (messages.length === 0) return <EmptyState />;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLast={idx === messages.length - 1}
            onRegenerate={idx === messages.length - 1 ? onRegenerate : undefined}
          />
        ))}
        <div ref={bottomRef} className="h-px" aria-hidden="true" />
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';
