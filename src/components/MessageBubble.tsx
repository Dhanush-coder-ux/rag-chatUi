import React, { memo, useState, useCallback } from 'react';
import {
  Copy, Check, RefreshCw, Search, Globe, BrainCircuit, FileText, User, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Message, ToolUse } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { copyToClipboard, formatTimestamp } from '../utils';
import { SourceItem } from '../context/RagContext'; // Updated import for sources

// ── Streaming Cursor ────────────────────────────────────────────────────────
const StreamingCursor = () => (
  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
);

// ── Tool Step UI (Real-time AI Thinking) ───────────────────────────────────
const ToolIcon: React.FC<{ icon: ToolUse['icon'] }> = ({ icon }) => {
  const cls = 'w-4 h-4';
  if (icon === 'search') return <Search className={cls} />;
  if (icon === 'web') return <Globe className={cls} />;
  return <BrainCircuit className={cls} />;
};

const ToolStep: React.FC<{ tool: ToolUse }> = ({ tool }) => (
  <div className="flex items-center gap-3 py-1.5 text-sm animate-in fade-in slide-in-from-left-2 duration-300">
    <div className={`flex items-center justify-center w-6 h-6 rounded-md ${
      tool.status === 'running' 
        ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' 
        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
    }`}>
      <ToolIcon icon={tool.icon} />
    </div>
    
    <span className={`font-medium ${
      tool.status === 'running' ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'
    }`}>
      {tool.label}
    </span>
    
    {tool.status === 'running' && (
      <span className="flex gap-1 ml-1">
        {[0, 1, 2].map((i) => (
          <span 
            key={i} 
            className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }} 
          />
        ))}
      </span>
    )}
    
    {tool.status === 'done' && <Check className="w-4 h-4 text-emerald-500 ml-auto" />}
  </div>
);

// ── Collapsible Sources Panel ────────────────────────────────────────────────
const SourcesPanel: React.FC<{ sources: SourceItem[] }> = ({ sources }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!sources?.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-500">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors w-full"
      >
        <FileText className="w-3.5 h-3.5" />
        {sources.length} Sources Found
        {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
      </button>
      
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {sources.map((s, i) => (
            <div 
              key={i}
              className="group flex flex-col gap-1 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-700/50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 max-w-[75%]">
                  {s.source_type === 'web' ? (
                    <Globe className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0" />
                  )}
                  {/* Handle dynamic title or fallback to URL */}
                  <span className="font-medium text-xs text-zinc-700 dark:text-zinc-200 truncate">
                    {s.title || s.url || 'Document Source'}
                  </span>
                </div>
                {s.score !== null && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                    {Math.round(s.score * 100)}% Match
                  </span>
                )}
              </div>
              {s.snippet && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                  "{s.snippet}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main MessageBubble ───────────────────────────────────────────────────────
interface Props {
  message: Message;
  onRegenerate?: () => void;
  isLast?: boolean;
}

export const MessageBubble: React.FC<Props> = memo(({ message, onRegenerate, isLast }) => {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.streamStatus === 'streaming';
  const showTools = !isUser && message.tools?.length;
  const isEmpty = !message.content && isStreaming;

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(message.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [message.content]);

  return (
    <div
      className={`group flex gap-4 px-4 py-6 w-full max-w-4xl mx-auto transition-colors ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-medium shadow-sm transition-transform duration-300 ${
        isUser
          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
          : 'bg-white border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800'
      }`}>
        {isUser ? <User className="w-5 h-5" /> : (
          <img src="/images/vaathi.png" alt="Vaathi AI" className="w-full h-full object-contain p-1.5" />
        )}
      </div>

      {/* Content Container */}
      <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Tool Status (Only when generating) */}
        {showTools && isStreaming && isEmpty && (
          <div className="flex flex-col gap-1 mb-2">
            {message.tools!.map(t => <ToolStep key={t.id} tool={t} />)}
          </div>
        )}

        {/* Message Bubble Body */}
        <div className={`relative px-5 py-4 text-[15px] leading-relaxed shadow-sm transition-all duration-300
          ${isUser
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-3xl rounded-tr-sm'
            : 'bg-white dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 rounded-3xl rounded-tl-sm border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm'
          }
          ${message.isError ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : ''}
        `}>
          
          {/* Main Content Area */}
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {isEmpty && !showTools ? (
              // Simple Typing Indicator if no tools provided
              <div className="flex items-center gap-1.5 h-6">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }} />
                ))}
              </div>
            ) : isUser ? (
              <p className="whitespace-pre-wrap m-0">{message.content}</p>
            ) : (
              <>
                {!isEmpty && <MarkdownRenderer content={message.content} />}
                {isStreaming && !isEmpty && <StreamingCursor />}
              </>
            )}
          </div>

          {/* Sources Section */}
          {!isUser && !isStreaming && message.sources && <SourcesPanel sources={message.sources} />}

          {/* Error Message */}
          {message.isError && (
             <div className="flex items-center gap-2 mt-3 text-sm text-red-600 dark:text-red-400 font-medium bg-red-100/50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                Response failed to generate. Please try again.
             </div>
          )}
        </div>

        {/* Action Row */}
        <div className={`flex items-center gap-2 transition-opacity duration-200 ${
          (hovered && !isStreaming) ? 'opacity-100' : 'opacity-0'
        }`}>
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mr-2">
            {formatTimestamp(message.timestamp)}
          </span>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Copy message"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          
          {!isUser && isLast && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Regenerate response"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';