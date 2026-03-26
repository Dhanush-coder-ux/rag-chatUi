import React, { useEffect, useRef, memo, useCallback, useState } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { Bot, Loader2, Sparkles, FileSearch, BrainCircuit, PenTool } from 'lucide-react';
import { useRagContext } from '../context/RagContext';

interface Props {
  messages: Message[];
  onRegenerate?: () => void;
}

// --- Empty State Splash ---
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center select-none animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="relative w-16 h-16 group">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 dark:from-violet-500/30 dark:to-indigo-500/30 blur-xl group-hover:blur-2xl transition-all duration-500" />
      <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 transform group-hover:scale-105 transition-transform duration-300 overflow-hidden">
        <img 
          src="/images/vaathi.png" 
          alt="Vaathi Logo" 
          className="w-full h-full object-contain p-2"
        />
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

// --- Multi-Step Thinking Indicator ---
const ThinkingStages = [
  { text: "Vaathi is understanding your question...", icon: BrainCircuit },
  { text: "Vaathi is searching documents...", icon: FileSearch },
  { text: "Vaathi is analyzing relevant chunks...", icon: Sparkles },
  { text: "Vaathi is generating the answer...", icon: PenTool },
];

const ThinkingSkeleton: React.FC = () => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < ThinkingStages.length - 1 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = ThinkingStages[stageIndex].icon;

  return (
    <div className="flex gap-4 w-full group animate-in fade-in slide-in-from-bottom-2 duration-300 px-4 py-2">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center border border-violet-200/50 dark:border-violet-700/30">
        <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div className="flex items-center gap-2 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/20 px-3 py-1.5 rounded-full w-fit border border-violet-100/50 dark:border-violet-800/30 backdrop-blur-sm animate-pulse">
          <CurrentIcon className="w-3.5 h-3.5 animate-bounce" style={{ animationDuration: '2s' }} />
          <span className="transition-opacity duration-300">{ThinkingStages[stageIndex].text}</span>
        </div>
        
        <div className="space-y-2 mt-2">
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-3/4 animate-pulse opacity-60" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-full animate-pulse opacity-40" style={{ animationDelay: '200ms' }} />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-5/6 animate-pulse opacity-20" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
};

// --- Main Message List Component ---
export const MessageList: React.FC<Props> = memo(({ messages, onRegenerate }) => {
  const { isLoading } = useRagContext(); 
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
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    userScrolledUpRef.current = false;
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages.length === 0]);

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
        
        {isLoading && (
          <div className="pt-2">
            <ThinkingSkeleton />
          </div>
        )}
        
        <div ref={bottomRef} className="h-6" aria-hidden="true" />
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';