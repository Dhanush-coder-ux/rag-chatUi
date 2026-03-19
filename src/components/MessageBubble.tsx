import React, { memo, useState, useCallback } from 'react';
import {
  Copy, Check, RefreshCw, Search, Globe, Brain, FileText, User
} from 'lucide-react';
import { Message, ToolUse } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { StreamingCursor } from './StreamingCursor';
import { TypingIndicator } from './TypingIndicator';
import { copyToClipboard, formatTimestamp } from '../utils';

// ── Tool Step indicator ─────────────────────────────────────────────────────

const ToolIcon: React.FC<{ icon: ToolUse['icon'] }> = ({ icon }) => {
  const cls = 'w-3.5 h-3.5';
  if (icon === 'search') return <Search className={cls} />;
  if (icon === 'web') return <Globe className={cls} />;
  return <Brain className={cls} />;
};

const ToolStep: React.FC<{ tool: ToolUse }> = ({ tool }) => (
  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
    <span className={`flex items-center gap-1.5 ${tool.status === 'running' ? 'text-blue-500 dark:text-blue-400' : ''}`}>
      <ToolIcon icon={tool.icon} />
      {tool.label}
      {tool.status === 'running' && (
        <span className="inline-flex gap-[3px]">
          {[0,1,2].map(i => (
            <span key={i} className="w-[3px] h-[3px] rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: `${i * 100}ms`, animationDuration: '600ms' }} />
          ))}
        </span>
      )}
      {tool.status === 'done' && <Check className="w-3 h-3 text-emerald-500" />}
    </span>
  </div>
);

// ── Sources panel ────────────────────────────────────────────────────────────

const SourcesPanel: React.FC<{ sources: Message['sources'] }> = ({ sources }) => {
  if (!sources?.length) return null;
  return (
    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((s, i) => (
          <div key={i}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-default text-xs text-zinc-600 dark:text-zinc-300"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span className="truncate max-w-[140px]">{s.filename}</span>
          </div>
        ))}
      </div>
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
      className={`group flex gap-3 px-4 py-3 rounded-2xl transition-colors ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
        ${isUser
          ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm'
          : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm'
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1.5 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>

        {/* Bubble */}
        <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
          ${isUser
            ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-tr-sm'
            : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-tl-sm border border-zinc-100 dark:border-zinc-800'
          }
          ${message.isError ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30' : ''}
        `}>

          {/* Tool steps (above content) */}
          {showTools && (
            <div className="flex flex-col gap-1 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              {message.tools!.map(t => <ToolStep key={t.id} tool={t} />)}
            </div>
          )}

          {/* Content */}
          {isEmpty ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}

          {/* Streaming cursor */}
          {isStreaming && !isEmpty && (
            <StreamingCursor />
          )}

          {/* Sources */}
          {!isUser && <SourcesPanel sources={message.sources} />}

          {/* Error badge */}
          {message.isError && (
            <p className="mt-1 text-xs text-red-500">Response failed — please try again.</p>
          )}
        </div>

        {/* Actions row */}
        <div className={`flex items-center gap-1 transition-opacity duration-150 ${hovered && !isStreaming ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mr-1">
            {formatTimestamp(message.timestamp)}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {!isUser && isLast && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Regenerate response"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
