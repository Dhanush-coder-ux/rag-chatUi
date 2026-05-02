import React, { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUp, Square, Globe, FileText, Layers, Cpu, ChevronDown, Check } from 'lucide-react';
import { useRagContext, RagMode, LlmModel } from '../context/RagContext';
import { FileUploadButton } from './FileUploadButton';

interface Props {
  onSubmit: (question: string) => void;
}

export const ChatInput: React.FC<Props> = ({ onSubmit }) => {
  const { isLoading, documents, mode, setMode, model, setModel } = useRagContext();
  const [value, setValue] = useState('');
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Custom Dropdown State
  const [isModelOpen, setIsModelOpen] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSubmit(trimmed);
  }, [value, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const placeholder =
    mode === 'web'      ? 'Search the web...' :
    mode === 'hybrid'   ? 'Ask anything (Web + Docs)...' :
                          'Ask about your documents...';

  const canSubmit = value.trim().length > 0 && !isLoading;

  // Model Options Configuration
  const modelOptions: { value: LlmModel; label: string }[] = [
    { value: 'auto', label: 'Auto (Fallback)' },
    { value: 'gemini', label: 'Gemini 2.5 Flash' },
    { value: 'llama3', label: 'Llama 3 Local' },
  ];
  
  const selectedModelLabel = modelOptions.find(o => o.value === model)?.label || 'Auto (Fallback)';

  return (
    <div className="px-4 pb-6 pt-2 w-full max-w-4xl mx-auto relative">

      {/* ── Mode & Model Selectors ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 px-1 relative z-20">
        
        {/* Left Side: Modes */}
        <div className="flex items-center gap-1.5">
          <ModeButton
            active={mode === 'documents'}
            onClick={() => setMode('documents')}
            icon={<FileText className="w-4 h-4" />}
            label="Documents"
            count={documents.length}
          />
          <ModeButton
            active={mode === 'web'}
            onClick={() => setMode('web')}
            icon={<Globe className="w-4 h-4" />}
            label="Web Search"
          />
          <ModeButton
            active={mode === 'hybrid'}
            onClick={() => setMode('hybrid')}
            icon={<Layers className="w-4 h-4" />}
            label="Hybrid"
          />
        </div>

        {/* Right Side: Custom Model Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setIsModelOpen(!isModelOpen)}
            className="flex items-center justify-between w-40 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <div className="flex items-center overflow-hidden">
              <Cpu className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
              <span className="truncate">{selectedModelLabel}</span>
            </div>
            <ChevronDown 
              className={`w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1 transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Popover Menu (Opens Upwards) */}
          {isModelOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Select Model
              </div>
              <ul className="p-1 flex flex-col gap-0.5">
                {modelOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setModel(option.value);
                        setIsModelOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors
                        ${model === option.value 
                          ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' 
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                      {option.label}
                      {model === option.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Input Area ───────────────────────────────────────────── */}
      <div className="relative flex flex-col bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300 focus-within:border-zinc-300 dark:focus-within:border-zinc-600 focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.3)] z-10">

        {mode === 'documents' && documents.length > 0 && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-2.5 py-1 rounded-lg text-xs font-medium border border-violet-100 dark:border-violet-800/50">
              <FileText className="w-3.5 h-3.5" />
              Searching {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 px-3 py-3">
          <div className="shrink-0 mb-1 ml-1">
            <FileUploadButton />
          </div>

          <textarea
            ref={textareaRef}
            data-chat-input
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent text-[15px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 outline-none leading-relaxed py-1.5 max-h-48 overflow-y-auto scrollbar-thin"
            aria-label="Chat input"
            aria-multiline="true"
            disabled={isLoading}
            style={{ minHeight: '36px' }}
          />

          <div className="shrink-0 mb-1 mr-1">
            {isLoading ? (
              <button
                onClick={() => {/* TODO: abort controller */}}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Stop generating"
              >
                <Square className="w-4 h-4 fill-current animate-pulse" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200
                  ${canSubmit
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md hover:scale-105 active:scale-95'
                    : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                  }`}
                aria-label="Send message"
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-3 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
          Vaathi may produce inaccurate information about people, places, or facts.
        </p>
      </div>
    </div>
  );
};

// ── Mode Button ───────────────────────────────────────────────────────────────

interface ModeButtonProps {
  active:  boolean;
  onClick: () => void;
  icon:    React.ReactNode;
  label:   string;
  count?:  number;
}

const ModeButton: React.FC<ModeButtonProps> = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border
      ${active
        ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
        : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-300'
      }`}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`ml-1 px-1.5 rounded-md text-[10px] ${active ? 'bg-zinc-100 dark:bg-zinc-700' : 'bg-zinc-200/50 dark:bg-zinc-800/50'}`}>
        {count}
      </span>
    )}
  </button>
);