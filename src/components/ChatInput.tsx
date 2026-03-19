import React, { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { FileUploadButton } from './FileUploadButton';

export const ChatInput: React.FC = () => {
  const { sendMessage, stopStreaming, state } = useChat();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = state.streamStatus === 'streaming';

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, isStreaming, sendMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const canSubmit = value.trim().length > 0 && !isStreaming;

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg shadow-zinc-100/50 dark:shadow-zinc-950/50 focus-within:border-violet-400 dark:focus-within:border-violet-500 focus-within:shadow-violet-100/50 dark:focus-within:shadow-violet-950/30 transition-all duration-200 px-3 py-2.5">

          {/* File upload */}
          <div className="shrink-0 self-end mb-0.5">
            <FileUploadButton />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            data-chat-input
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your documents…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none leading-relaxed py-1.5 max-h-48 overflow-y-auto scrollbar-thin"
            aria-label="Chat input"
            aria-multiline="true"
            disabled={false}
            style={{ minHeight: '36px' }}
          />

          {/* Submit / Stop */}
          <div className="shrink-0 self-end mb-0.5">
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                aria-label="Stop generating"
                title="Stop generating"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150
                  ${canSubmit
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  }`}
                aria-label="Send message"
                title="Send (Enter)"
              >
                <ArrowUp className="w-4.5 h-4.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600 mt-2">
          Press <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-[10px]">Enter</kbd> to send,{' '}
          <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};
