import React, { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUp, Square, Globe, FileText, Layers, Cpu, ChevronDown, Check, X } from 'lucide-react';
import { useRagContext, RagMode, LlmModel } from '../context/RagContext';
import { FileUploadButton } from './FileUploadButton';
import { YoutubeUploadButton } from './YoutubeUploadButton';

interface Props {
  onSubmit: (question: string) => void;
}

export const ChatInput: React.FC<Props> = ({ onSubmit }) => {
  const { isLoading, documents, mode, setMode, model, setModel, selectedDocumentIds, clearSelectedDocuments } = useRagContext();
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
            className="flex items-center justify-between w-40 bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted hover:text-foreground transition-colors"
          >
            <div className="flex items-center overflow-hidden">
              <Cpu className="w-3.5 h-3.5 mr-2 shrink-0" />
              <span className="truncate">{selectedModelLabel}</span>
            </div>
            <ChevronDown 
              className={`w-3.5 h-3.5 shrink-0 ml-1 transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Popover Menu (Opens Upwards) */}
          {isModelOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-popover border border-border rounded-xl shadow-premium dark:shadow-premium-dark overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                          ? 'bg-primary/10 text-primary' 
                          : 'text-foreground hover:bg-muted'
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
      <div className="relative flex flex-col bg-card/80 backdrop-blur-xl border border-border shadow-premium dark:shadow-premium-dark rounded-3xl transition-all duration-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 z-10">

        {mode === 'documents' && (
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-1">
            {selectedDocumentIds.length > 0 ? (
              <div className="flex items-center gap-1.5 bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 px-2.5 py-1 rounded-lg text-xs font-medium border border-violet-200 dark:border-violet-500/30">
                <FileText className="w-3.5 h-3.5" />
                <span>Searching specific {selectedDocumentIds.length} {selectedDocumentIds.length === 1 ? 'document' : 'documents'}</span>
                <button onClick={() => clearSelectedDocuments()} className="ml-1 p-0.5 rounded-full hover:bg-violet-200 dark:hover:bg-violet-500/30 hover:text-rose-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : documents.length > 0 ? (
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-medium border border-primary/20">
                <FileText className="w-3.5 h-3.5" />
                Searching all {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-end gap-2 px-3 py-3">
          <div className="shrink-0 mb-1 ml-1 flex items-center gap-1">
            <FileUploadButton />
            <YoutubeUploadButton />
          </div>

          <textarea
            ref={textareaRef}
            data-chat-input
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent text-[15px] text-foreground placeholder-muted-foreground outline-none leading-relaxed py-1.5 max-h-48 overflow-y-auto scrollbar-thin"
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
                    ? 'bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-md hover:scale-105 active:scale-95 border border-primary/20'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
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
        ? 'bg-card border-border text-foreground shadow-sm'
        : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`ml-1 px-1.5 rounded-md text-[10px] ${active ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'}`}>
        {count}
      </span>
    )}
  </button>
);