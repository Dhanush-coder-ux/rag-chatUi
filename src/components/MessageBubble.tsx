// components/MessageBubble.tsx — VAATHI OS Terminal Log Style
import React, { memo, useState, useCallback } from 'react';
import {
  Copy, Check, RefreshCw, Search, Globe, BrainCircuit,
  FileText, ChevronDown, ChevronUp, AlertCircle, ExternalLink, Youtube,
  Terminal, User, Cpu, Zap,
} from 'lucide-react';
import { Message, ToolUse, SourceItem } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { copyToClipboard, formatTimestamp, extractYoutubeVideoId, getYoutubeThumbnailUrl } from '../utils';

// ── Streaming Cursor ──────────────────────────────────────────────────────────
const StreamingCursor = () => (
  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-sys-green animate-blink" />
);

// ── Tool Step ─────────────────────────────────────────────────────────────────
const ToolIcon: React.FC<{ icon: ToolUse['icon'] }> = ({ icon }) => {
  const cls = 'w-3.5 h-3.5';
  if (icon === 'search') return <Search className={cls} />;
  if (icon === 'web')    return <Globe  className={cls} />;
  return <BrainCircuit className={cls} />;
};

const ToolStep: React.FC<{ tool: ToolUse }> = ({ tool }) => (
  <div className="flex items-center gap-2.5 py-1 text-xs animate-in fade-in slide-in-from-left-2 duration-300 font-mono">
    <div className={`flex items-center justify-center w-5 h-5 rounded ${
      tool.status === 'running'
        ? 'bg-sys-green/15 text-sys-green'
        : 'bg-sys-success/15 text-sys-success'
    }`}>
      <ToolIcon icon={tool.icon} />
    </div>
    <span className="text-[11px]" style={{
      color: tool.status === 'running' ? '#76b900' : '#94A3B8',
    }}>
      {tool.label}
    </span>
    {tool.status === 'running' && (
      <span className="flex gap-0.5 ml-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-sys-green animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }}
          />
        ))}
      </span>
    )}
    {tool.status === 'done' && (
      <Check className="w-3.5 h-3.5 text-sys-success ml-auto" />
    )}
  </div>
);

// ── Sources Panel ─────────────────────────────────────────────────────────────
const SourcesPanel: React.FC<{ sources?: SourceItem[] }> = ({ sources }) => {
  const [expanded, setExpanded] = useState(false);
  if (!sources?.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-sys-border/50 animate-in fade-in duration-500">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest
          text-muted-foreground hover:text-sys-green transition-colors w-full font-mono"
      >
        <FileText className="w-3.5 h-3.5" />
        {sources.length} Source{sources.length > 1 ? 's' : ''} Retrieved
        {expanded
          ? <ChevronUp   className="w-3.5 h-3.5 ml-auto" />
          : <ChevronDown className="w-3.5 h-3.5 ml-auto" />
        }
      </button>
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3
          animate-in fade-in slide-in-from-top-2 duration-300">
          {sources.map((s, i) => <SourceCard key={i} source={s} />)}
        </div>
      )}
    </div>
  );
};

// ── Source Card ───────────────────────────────────────────────────────────────
const SourceCard: React.FC<{ source: SourceItem }> = ({ source }) => {
  const isWeb = source.source_type === 'web';
  const youtubeVideoId = source.url
    ? extractYoutubeVideoId(source.url)
    : source.title
    ? extractYoutubeVideoId(source.title)
    : null;
  const thumbnailUrl = youtubeVideoId ? getYoutubeThumbnailUrl(youtubeVideoId, 'hq') : null;

  const inner = (
    <div className="group flex flex-col gap-1.5 p-3 rounded-lg transition-all border border-sys-border hover:border-sys-green/25"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {youtubeVideoId ? (
            <Youtube className="w-3.5 h-3.5 text-red-400 shrink-0" />
          ) : isWeb ? (
            <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-sys-green shrink-0" />
          )}
          <span className="font-medium text-xs text-foreground truncate">
            {source.title ?? (isWeb ? source.url : 'Your Document')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {source.score != null && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
              style={{ background: 'rgba(118,185,0,0.1)', color: '#76b900' }}>
              {Math.round(source.score * 100)}%
            </span>
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono ${
            youtubeVideoId
              ? 'text-red-400'
              : isWeb
              ? 'text-sky-400'
              : 'text-sys-green'
          }`} style={
            youtubeVideoId
              ? { background: 'rgba(239,68,68,0.1)' }
              : isWeb
              ? { background: 'rgba(56,189,248,0.1)' }
              : { background: 'rgba(118,185,0,0.1)' }
          }>
            {youtubeVideoId ? 'YT' : isWeb ? 'WEB' : 'DOC'}
          </span>
          {isWeb && <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-sys-green transition-colors" />}
        </div>
      </div>
      {youtubeVideoId && thumbnailUrl && (
        <img src={thumbnailUrl} alt={source.title || 'YouTube video'}
          className="w-full h-24 object-cover rounded mt-1"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      {source.snippet && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {source.snippet}
        </p>
      )}
      {source.image && !youtubeVideoId && (
        <img src={source.image} alt={source.title || 'preview'}
          className="w-full h-24 object-cover rounded" />
      )}
    </div>
  );

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
      className={`group w-full max-w-4xl mx-auto animate-in fade-in duration-300`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex gap-3 px-2">
        {/* ── Avatar / Role Tag ─────────────────────────────────────────────── */}
        <div className="shrink-0 flex flex-col items-center gap-1 pt-3">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold font-mono border ${
            isUser
              ? 'text-foreground border-sys-border'
              : 'text-sys-green border-sys-green/30'
          }`} style={isUser
            ? { background: 'rgba(255,255,255,0.06)' }
            : { background: 'rgba(118,185,0,0.08)', boxShadow: '0 0 8px rgba(118,185,0,0.15)' }
          }>
            {isUser ? <User className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 pb-6">
          {/* Role label */}
          <div className="flex items-center gap-2 mb-2 pt-2.5 flex-wrap">
            <span className="system-label" style={{ color: isUser ? '#94A3B8' : '#76b900', fontSize: '10px' }}>
              {isUser ? 'USER INPUT' : 'VAATHI · ASSISTANT'}
            </span>
            <span className="system-label" style={{ fontSize: '9px', opacity: 0.5 }}>
              {formatTimestamp(message.timestamp)}
            </span>
            {isStreaming && !isUser && (
              <span className="system-label animate-pulse" style={{ color: '#76b900', fontSize: '9px' }}>
                ● STREAMING
              </span>
            )}
            {/* Model badge — shown as soon as we know which model ran */}
            {!isUser && message.modelUsed && (() => {
              const m = message.modelUsed;
              const isGemini  = m.startsWith('gemini');
              const isGroq    = m === 'groq';
              const isNvidia  = m === 'nvidia';
              const isNemotron = m === 'nemotron';
              const bg    = isGemini ? 'rgba(99,102,241,0.15)' : isGroq ? 'rgba(249,115,22,0.15)' : isNemotron ? 'rgba(0,212,255,0.15)' : isNvidia ? 'rgba(118,185,0,0.15)' : 'rgba(34,197,94,0.15)';
              const color = isGemini ? '#818CF8'              : isGroq ? '#FB923C'              : isNemotron ? '#00D4FF'              : isNvidia ? '#76B900'              : '#4ADE80';
              const border = isGemini ? 'rgba(99,102,241,0.3)' : isGroq ? 'rgba(249,115,22,0.3)' : isNemotron ? 'rgba(0,212,255,0.3)' : isNvidia ? 'rgba(118,185,0,0.3)' : 'rgba(34,197,94,0.3)';
              const label = isGemini ? 'Gemini 2.5 Flash' : isGroq ? 'Groq · Llama 3.3' : isNemotron ? 'Nemotron 3 VoiceChat' : isNvidia ? 'NVIDIA · GLM-5.1' : m;
              return (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-bold"
                  style={{ fontSize: '9px', background: bg, color, border: `1px solid ${border}` }}
                  title={`Answer generated by ${m}`}
                >
                  {isGemini ? <Zap className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
                  {label}
                </span>
              );
            })()}
          </div>

          {/* Tool steps (before content loads) */}
          {showTools && isStreaming && isEmpty && (
            <div className="flex flex-col gap-1 mb-3 px-3 py-2 rounded-lg border border-sys-border"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              <p className="system-label mb-1.5" style={{ fontSize: '9px' }}>PIPELINE EXECUTION</p>
              {message.tools!.map(t => <ToolStep key={t.id} tool={t} />)}
            </div>
          )}

          {/* Message bubble */}
          <div className={`relative text-[14px] leading-relaxed px-4 py-3.5 rounded-xl
            ${isUser ? 'msg-user' : 'msg-assistant'}
            ${message.isError ? 'border-red-500/30 bg-red-500/5' : ''}
          `}>
            {/* Dot matrix top accent for AI message */}
            {!isUser && (
              <div className="absolute top-0 left-4 right-4 h-px"
                style={{ background: 'linear-gradient(90deg, #76b900, transparent)' }} />
            )}

            <div className={`${isUser ? '' : 'prose prose-invert max-w-none prose-sm'}`}>
              {isEmpty && !showTools ? (
                <div className="flex items-center gap-1.5 h-5">
                  {[0,1,2].map(i => (
                    <span key={i}
                      className="w-1.5 h-1.5 rounded-full bg-sys-green animate-bounce"
                      style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }}
                    />
                  ))}
                </div>
              ) : isUser ? (
                <p className="whitespace-pre-wrap m-0 text-foreground">{message.content}</p>
              ) : (
                <>
                  {!isEmpty && <MarkdownRenderer content={message.content} />}
                  {isStreaming && !isEmpty && <StreamingCursor />}
                </>
              )}
            </div>

            {/* Tool steps after content */}
            {showTools && (!isStreaming || !isEmpty) && (
              <div className="flex flex-col gap-1 mt-4 pt-3 border-t border-sys-border">
                <p className="system-label mb-1.5" style={{ fontSize: '9px' }}>TOOLS USED</p>
                {message.tools!.map(t => <ToolStep key={t.id} tool={t} />)}
              </div>
            )}

            {/* Sources */}
            {!isUser && !isStreaming && <SourcesPanel sources={message.sources} />}

            {/* Confidence */}
            {!isUser && !isStreaming && message.confidence != null && (
              <div className="mt-3 flex items-center gap-2">
                <span className="system-label">CONFIDENCE</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                  message.confidence >= 0.7
                    ? 'text-sys-success'
                    : message.confidence >= 0.4
                    ? 'text-sys-warning'
                    : 'text-red-400'
                }`} style={
                  message.confidence >= 0.7
                    ? { background: 'rgba(34,197,94,0.1)' }
                    : message.confidence >= 0.4
                    ? { background: 'rgba(245,158,11,0.1)' }
                    : { background: 'rgba(239,68,68,0.1)' }
                }>
                  {Math.round(message.confidence * 100)}%
                </span>
              </div>
            )}

            {/* Error */}
            {message.isError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-400 font-medium px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                SYSTEM ERROR: Response generation failed. Retry command.
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className={`flex items-center gap-2 mt-2 transition-opacity duration-200 ${
            hovered && !isStreaming ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono
                text-muted-foreground hover:text-sys-green hover:bg-sys-green/8
                transition-all border border-transparent hover:border-sys-green/20"
              aria-label="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-sys-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
            {!isUser && isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono
                  text-muted-foreground hover:text-sys-warning hover:bg-sys-warning/8
                  transition-all border border-transparent hover:border-sys-warning/20"
                aria-label="Regenerate response"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RETRY</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Separator line */}
      <div className="h-px bg-sys-border/30 mx-4" />
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';