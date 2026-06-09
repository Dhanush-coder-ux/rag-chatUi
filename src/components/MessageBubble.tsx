import React, { memo, useState, useCallback } from 'react';
import {
  Copy, Check, RefreshCw, Search, Globe, BrainCircuit,
  FileText, User, ChevronDown, ChevronUp, AlertCircle, ExternalLink, Youtube,
} from 'lucide-react';
import { Message, ToolUse, SourceItem } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { copyToClipboard, formatTimestamp, extractYoutubeVideoId, getYoutubeThumbnailUrl } from '../utils';

// ── Streaming Cursor ──────────────────────────────────────────────────────────
const StreamingCursor = () => (
  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
);

// ── Tool Step ─────────────────────────────────────────────────────────────────
const ToolIcon: React.FC<{ icon: ToolUse['icon'] }> = ({ icon }) => {
  const cls = 'w-4 h-4';
  if (icon === 'search') return <Search className={cls} />;
  if (icon === 'web')    return <Globe className={cls} />;
  return <BrainCircuit className={cls} />;
};

const ToolStep: React.FC<{ tool: ToolUse }> = ({ tool }) => (
  <div className="flex items-center gap-3 py-1.5 text-sm animate-in fade-in slide-in-from-left-2 duration-300">
    <div className={`flex items-center justify-center w-6 h-6 rounded-md ${
      tool.status === 'running'
        ? 'bg-primary/10 text-primary'
        : 'bg-emerald-500/10 text-emerald-500'
    }`}>
      <ToolIcon icon={tool.icon} />
    </div>
    <span className={`font-medium ${
      tool.status === 'running' ? 'text-foreground' : 'text-muted-foreground'
    }`}>
      {tool.label}
    </span>
    {tool.status === 'running' && (
      <span className="flex gap-1 ml-1">
        {[0, 1, 2].map(i => (
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

// ── Sources Panel — now typed with SourceItem ─────────────────────────────────
const SourcesPanel: React.FC<{ sources?: SourceItem[] }> = ({ sources }) => {
  const [expanded, setExpanded] = useState(false);
  if (!sources?.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in duration-500">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <FileText className="w-3.5 h-3.5" />
        {sources.length} Source{sources.length > 1 ? 's' : ''} Found
        {expanded
          ? <ChevronUp   className="w-3.5 h-3.5 ml-auto" />
          : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {sources.map((s, i) => (
            <SourceCard key={i} source={s} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Source Card — handles both 'document' and 'web' source types ──────────────
const SourceCard: React.FC<{ source: SourceItem }> = ({ source }) => {
  const isWeb = source.source_type === 'web';
  
  // Check if this is a YouTube source
  const youtubeVideoId = source.url 
    ? extractYoutubeVideoId(source.url)
    : source.title
    ? extractYoutubeVideoId(source.title)
    : null;
  
  const thumbnailUrl = youtubeVideoId ? getYoutubeThumbnailUrl(youtubeVideoId, 'hq') : null;

  const inner = (
    <div className="group flex flex-col gap-1 p-3 rounded-xl bg-card hover:bg-muted transition-all border border-border shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {youtubeVideoId ? (
            <Youtube className="w-4 h-4 text-red-500 shrink-0" />
          ) : isWeb ? (
            <Globe    className="w-4 h-4 text-sky-500 shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-primary shrink-0" />
          )}
          <span className="font-medium text-xs text-foreground truncate">
            {source.title ?? (isWeb ? source.url : 'Your Document')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {source.score != null && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {Math.round(source.score * 100)}%
            </span>
          )}
          {/* Badge for source type */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            youtubeVideoId
              ? 'bg-red-500/10 text-red-500'
              : isWeb
              ? 'bg-sky-500/10 text-sky-500'
              : 'bg-primary/10 text-primary'
          }`}>
            {youtubeVideoId ? 'YouTube' : isWeb ? 'Web' : 'Doc'}
          </span>
          {isWeb && <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-sky-500 transition-colors" />}
        </div>
      </div>

      {/* YouTube thumbnail preview */}
      {youtubeVideoId && thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={source.title || 'YouTube video'}
          className="w-full h-28 object-cover rounded-lg mt-2 mb-1"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {source.snippet && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
          "{source.snippet}"
        </p>
      )}
      {source.image && !youtubeVideoId && (
        <img
          src={source.image}
          alt={source.title || "preview"}
          className="w-full h-28 object-cover rounded-lg mb-2"
        />
      )}
    </div>
  );

  // Web sources are clickable links; doc sources are not
  return isWeb && source.url ? (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className="no-underline">
      {inner}
    </a>
  ) : inner;
};

// ── Main MessageBubble ────────────────────────────────────────────────────────
interface Props {
  message:       Message;
  onRegenerate?: () => void;
  isLast?:       boolean;
}

export const MessageBubble: React.FC<Props> = memo(({ message, onRegenerate, isLast }) => {
  const [copied,  setCopied]  = useState(false);
  const [hovered, setHovered] = useState(false);

  const isUser      = message.role === 'user';
  const isStreaming = message.streamStatus === 'streaming';
  const showTools   = !isUser && !!message.tools?.length;
  const isEmpty     = !message.content && isStreaming;

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
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 ${
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border border-border shadow-premium dark:shadow-premium-dark'
      }`}>
        {isUser
          ? <User className="w-5 h-5" />
          : <img src="/images/vaathi.png" alt="Vaathi AI" className="w-full h-full object-contain p-1.5" />}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>

        {/* Tool steps (only while streaming and no content yet) */}
        {showTools && isStreaming && isEmpty && (
          <div className="flex flex-col gap-1 mb-2">
            {message.tools!.map(t => <ToolStep key={t.id} tool={t} />)}
          </div>
        )}

        {/* Bubble */}
        <div className={`relative px-5 py-4 text-[15px] leading-relaxed shadow-sm transition-all duration-300
          ${isUser
            ? 'bg-muted text-foreground rounded-3xl rounded-tr-sm'
            : 'bg-card text-foreground rounded-3xl rounded-tl-sm border border-border/50 shadow-premium dark:shadow-premium-dark'
          }
          ${message.isError ? 'border-destructive/50 bg-destructive/10' : ''}
        `}>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {isEmpty && !showTools ? (
              <div className="flex items-center gap-1.5 h-6">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }} />
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

          {/* Sources — only after streaming finishes */}
          {!isUser && !isStreaming && <SourcesPanel sources={message.sources} />}

          {/* Confidence badge */}
          {!isUser && !isStreaming && message.confidence != null && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                Confidence
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                message.confidence >= 0.7
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : message.confidence >= 0.4
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}>
                {Math.round(message.confidence * 100)}%
              </span>
            </div>
          )}

          {message.isError && (
            <div className="flex items-center gap-2 mt-3 text-sm text-red-600 dark:text-red-400 font-medium bg-red-100/50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              Response failed to generate. Please try again.
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className={`flex items-center gap-2 transition-opacity duration-200 ${
          hovered && !isStreaming ? 'opacity-100' : 'opacity-0'
        }`}>
          <span className="text-xs font-medium text-muted-foreground mr-2">
            {formatTimestamp(message.timestamp)}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Copy message"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {!isUser && isLast && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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