// components/ChatInput.tsx — VAATHI OS Command Center
import React, { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import {
  ArrowUp, Square, Globe, FileText, Layers,
  Cpu, ChevronDown, Check, X, Paperclip, Mic,
} from 'lucide-react';
import { useRagContext, RagMode, LlmModel } from '../context/RagContext';
import { FileUploadButton } from './FileUploadButton';
import { YoutubeUploadButton } from './YoutubeUploadButton';
import { VoiceRecorderWS } from './VoiceRecorderWS';

interface Props {
  onSubmit: (question: string) => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  startRecording?: () => void;
  stopRecording?: () => void;
  abortVoice?: () => void;
  statusText?: string;
}

export const ChatInput: React.FC<Props> = ({
  onSubmit,
  isRecording = false,
  isProcessing = false,
  startRecording = () => { },
  stopRecording = () => { },
  abortVoice,
  statusText = ''
}) => {
  const { isLoading, documents, mode, setMode, model, setModel, selectedDocumentIds, clearSelectedDocuments, stopGenerating } = useRagContext();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [value]);

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
    mode === 'web' ? 'Search the web with VAATHI...' :
      mode === 'hybrid' ? 'Ask anything — Web + Docs mode active...' :
        'Ask VAATHI...';

  const canSubmit = value.trim().length > 0 && !isLoading;

  const modelOptions: { value: LlmModel; label: string; tag: string }[] = [
    { value: 'auto', label: 'Auto (Fallback)', tag: 'AUTO' },
    { value: 'gemini', label: 'Gemini 2.5 Flash', tag: 'GEMINI' },
    { value: 'groq', label: 'Groq (Llama 3.3 70B)', tag: 'GROQ' },
    { value: 'nvidia', label: 'NVIDIA · GLM-5.1 (NIM)', tag: 'NVIDIA' },
  ];
  const selectedModel = modelOptions.find(o => o.value === model) || modelOptions[0];

  return (
    <div className="px-4 pb-5 pt-2 w-full max-w-4xl mx-auto relative">

      {/* ── Top toolbar: Modes + Model ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2.5 px-1 relative z-20">

        {/* Mode buttons */}
        <div className="flex items-center gap-1">
          <ModeButton
            active={mode === 'documents'}
            onClick={() => setMode('documents')}
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Docs"
            count={documents.length}
          />
          <ModeButton
            active={mode === 'web'}
            onClick={() => setMode('web')}
            icon={<Globe className="w-3.5 h-3.5" />}
            label="Web"
          />
          <ModeButton
            active={mode === 'hybrid'}
            onClick={() => setMode('hybrid')}
            icon={<Layers className="w-3.5 h-3.5" />}
            label="Hybrid"
          />
        </div>

        {/* Model selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setIsModelOpen(!isModelOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sys-border
              text-[11px] font-mono font-medium text-muted-foreground
              hover:text-sys-green hover:border-sys-green/25 hover:bg-sys-green/5
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Cpu className="w-3 h-3" />
            <span>{selectedModel.tag}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} />
          </button>

          {isModelOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-52 py-1.5 rounded-xl z-50
              border border-sys-border shadow-premium-dark overflow-hidden
              animate-in fade-in zoom-in-95 duration-150"
              style={{ background: '#0F172A', backdropFilter: 'blur(20px)' }}>
              <div className="px-3 pb-1.5">
                <p className="system-label" style={{ fontSize: '9px' }}>SELECT AI ENGINE</p>
              </div>
              <div className="px-1.5 space-y-0.5">
                {modelOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setModel(option.value); setIsModelOpen(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg
                      text-xs font-medium text-left transition-colors
                      ${model === option.value
                        ? 'text-sys-green'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }`}
                    style={model === option.value ? { background: 'rgba(118,185,0,0.08)' } : {}}
                  >
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="system-label mt-0.5" style={{ fontSize: '8px' }}>{option.tag}</p>
                    </div>
                    {model === option.value && (
                      <Check className="w-3.5 h-3.5 text-sys-green" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Selected doc filter tag ──────────────────────────────────────── */}
      {mode === 'documents' && selectedDocumentIds.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg border border-sys-green/25"
          style={{ background: 'rgba(118,185,0,0.06)' }}>
          <FileText className="w-3.5 h-3.5 text-sys-green" />
          <span className="text-[11px] text-sys-green font-mono font-medium">
            TARGETING {selectedDocumentIds.length} DOCUMENT{selectedDocumentIds.length !== 1 ? 'S' : ''}
          </span>
          <button
            onClick={() => clearSelectedDocuments()}
            className="ml-auto p-0.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {mode === 'documents' && documents.length > 0 && selectedDocumentIds.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg border border-sys-border"
          style={{ background: 'rgba(118,185,0,0.03)' }}>
          <FileText className="w-3.5 h-3.5 text-sys-green/60" />
          <span className="text-[11px] text-muted-foreground font-mono">
            SEARCHING ALL {documents.length} DOCUMENT{documents.length !== 1 ? 'S' : ''}
          </span>
        </div>
      )}

      {/* ── Main Command Input ──────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col rounded-xl border transition-all duration-300 z-10"
        style={{
          background: 'rgba(17,24,39,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: isFocused ? 'rgba(118,185,0,0.35)' : '#1E293B',
          boxShadow: isFocused
            ? '0 0 20px rgba(118,185,0,0.2), 0 0 0 1px rgba(118,185,0,0.1), 0 4px 24px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Top accent line when focused */}
        {isFocused && (
          <div className="absolute top-0 inset-x-0 h-px rounded-t-xl"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(118,185,0,0.5), transparent)' }} />
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 px-3 py-3">
          {/* Left: Upload buttons */}
          <div className="shrink-0 flex items-center gap-1 mb-0.5">
            <FileUploadButton />
            <YoutubeUploadButton />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            data-chat-input
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent text-[14px] text-foreground
              placeholder-muted-foreground outline-none leading-relaxed py-1
              max-h-[180px] overflow-y-auto scrollbar-thin font-sans"
            aria-label="Chat input"
            aria-multiline="true"
            disabled={isLoading}
            style={{ minHeight: '36px' }}
          />

          {/* Right: Voice + Send */}
          <div className="shrink-0 flex items-center gap-1.5 mb-0.5">
            <VoiceRecorderWS
              isRecording={isRecording}
              isProcessing={isProcessing}
              startRecording={startRecording}
              stopRecording={stopRecording}
            />

            {isLoading || isProcessing ? (
              <button
                onClick={() => {
                  if (isProcessing && abortVoice) abortVoice();
                  else if (isLoading) stopGenerating();
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg border transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderColor: '#1E293B',
                }}
                aria-label="Stop generating"
              >
                <Square className="w-4 h-4 text-foreground fill-current animate-pulse" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-200
                  ${canSubmit
                    ? 'hover:scale-105 active:scale-95'
                    : 'cursor-not-allowed opacity-40'
                  }`}
                style={canSubmit ? {
                  background: 'linear-gradient(135deg, #76b900, #4A7A00)',
                  borderColor: 'rgba(118,185,0,0.3)',
                  boxShadow: '0 0 12px rgba(118,185,0,0.3)',
                  color: '#020617',
                } : {
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: '#1E293B',
                  color: '#94A3B8',
                }}
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 pb-2.5 pt-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sys-success" />
            <span className="system-label" style={{ fontSize: '9px' }}>
              VAATHI · {mode.toUpperCase()} MODE
              {statusText && ` · ${statusText}`}
            </span>
          </div>
          <span className="system-label" style={{ fontSize: '9px' }}>
            ↵ SEND · ⇧+↵ NEWLINE
          </span>
        </div>
      </div>

      <div className="text-center mt-2.5 opacity-50">
        <p className="text-[10px] text-muted-foreground font-mono">
          // VAATHI may produce inaccurate results — verify critical information
        </p>
      </div>
    </div>
  );
};

// ── Mode Button ───────────────────────────────────────────────────────────────
interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

const ModeButton: React.FC<ModeButtonProps> = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium
      transition-all duration-200 border
      ${active
        ? 'text-sys-green border-sys-green/30'
        : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground hover:border-sys-border'
      }`}
    style={active ? { background: 'rgba(118,185,0,0.08)' } : {}}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono
        ${active ? 'text-sys-green' : 'text-muted-foreground'}`}
        style={active
          ? { background: 'rgba(118,185,0,0.15)' }
          : { background: 'rgba(255,255,255,0.06)' }
        }>
        {count}
      </span>
    )}
  </button>
);