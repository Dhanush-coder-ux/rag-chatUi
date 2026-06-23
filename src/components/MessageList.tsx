// components/MessageList.tsx — VAATHI OS
import React, { useEffect, useRef, memo, useCallback } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { useRagContext } from '../context/RagContext';
import { Loader2 } from 'lucide-react';

interface Props {
  messages:      Message[];
  onRegenerate?: () => void;
}

// ── Session Loading State ─────────────────────────────────────────────────────
const SessionLoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
    <div className="relative">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(118,185,0,0.08)', border: '1px solid rgba(118,185,0,0.2)' }}>
        <Loader2 className="w-6 h-6 text-sys-green animate-spin" />
      </div>
      <div className="absolute -inset-2 rounded-2xl border border-sys-green/20 animate-ping" />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-foreground font-mono">Loading Conversation</p>
      <p className="text-[11px] text-muted-foreground mt-1 font-mono">// Fetching message history…</p>
    </div>
  </div>
);

// ── Main MessageList ──────────────────────────────────────────────────────────
export const MessageList: React.FC<Props> = memo(({ messages, onRegenerate }) => {
  const { isLoading, sessionLoading } = useRagContext();
  const bottomRef     = useRef<HTMLDivElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    scrolledUpRef.current = false;
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    });
  }, [messages.length === 0]);

  useEffect(() => {
    if (messages.length === 0) {
      scrolledUpRef.current = false;
    }
  }, [messages.length]);

  if (sessionLoading) return <SessionLoadingState />;

  // Empty state is handled by ChatLayout (shows Dashboard)
  if (messages.length === 0 && !isLoading) return null;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin relative"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
      <div className="max-w-4xl mx-auto py-6 space-y-2">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLast={idx === messages.length - 1}
            onRegenerate={idx === messages.length - 1 ? onRegenerate : undefined}
          />
        ))}
        <div ref={bottomRef} className="h-6" aria-hidden="true" />
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';