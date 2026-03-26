import React, { useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUp, Square, Globe, FileText, Layers } from 'lucide-react';
import { useRagContext, RagMode } from '../context/RagContext';
import { FileUploadButton } from './FileUploadButton';

export const ChatInput: React.FC = () => {
  // Pull mode and setMode directly from context
  const { askQuestion, isLoading, documents, mode, setMode } = useRagContext();
  const [value, setValue] = React.useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    // Parent/Context handler will handle the current `mode` internally
    await askQuestion(trimmed);
  }, [value, isLoading, askQuestion]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const canSubmit = value.trim().length > 0 && !isLoading;

  return (
    <div className="px-4 pb-6 pt-2 w-full max-w-4xl mx-auto relative">
      
      {/* ── Floating Mode Selector ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-3 px-1 transition-all duration-300">
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

      {/* ── Main Input Area ───────────────────────────────────────────────── */}
      <div className="relative flex flex-col bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300 focus-within:border-zinc-300 dark:focus-within:border-zinc-600 focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
        
        {/* Selected Document Indicator */}
        {mode === 'documents' && documents.length > 0 && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
             <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-2.5 py-1 rounded-lg text-xs font-medium border border-violet-100 dark:border-violet-800/50">
               <FileText className="w-3.5 h-3.5" />
               Searching {documents.length} {documents.length === 1 ? 'document' : 'documents'}
             </div>
          </div>
        )}

        <div className="flex items-end gap-2 px-3 py-3">
          {/* File Upload Button */}
          <div className="shrink-0 mb-1 ml-1">
            <FileUploadButton />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            data-chat-input
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'web' ? "Search the web..." :
              mode === 'hybrid' ? "Ask anything (Web + Docs)..." :
              "Ask about your documents..."
            }
            rows={1}
            className="flex-1 resize-none bg-transparent text-[15px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 outline-none leading-relaxed py-1.5 max-h-48 overflow-y-auto scrollbar-thin"
            aria-label="Chat input"
            aria-multiline="true"
            disabled={isLoading}
            style={{ minHeight: '36px' }}
          />

          {/* Submit / Stop Button */}
          <div className="shrink-0 mb-1 mr-1">
            {isLoading ? (
              <button
                onClick={() => console.log('Stop generation not yet implemented')} 
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
      
      {/* Footer Text */}
      <div className="text-center mt-3 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
          Vaathi may produce inaccurate information about people, places, or facts.
        </p>
      </div>
    </div>
  );
};

// ── Helper Component for Mode Buttons ─────────────────────────────────────────

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

const ModeButton: React.FC<ModeButtonProps> = ({ active, onClick, icon, label, count }) => {
  return (
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
};