// components/Sidebar.tsx — VAATHI OS Edition
import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Trash, MessageSquare, FileText,
  Loader2, MoreHorizontal, Pin, Share,
  ChevronDown,
  FileSpreadsheet, Image as ImageIcon, File,
  Database, BookOpen, Youtube,
  Zap, PanelLeftClose, Maximize2,
} from 'lucide-react';
import { useRagContext, ChatSession } from '../context/RagContext';
import { formatFileSize, getYoutubeVideoIdFromFilename, getYoutubeThumbnailUrl } from '../utils';

function useOutsideClick(ref: React.RefObject<HTMLElement>, callback: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, callback]);
}

const getFileIcon = (filename: string) => {
  const ext = filename?.split('.').pop()?.toLowerCase() ?? '';
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return <FileSpreadsheet className="w-3.5 h-3.5 text-sys-success" />;
  if (ext === 'pdf')
    return <FileText className="w-3.5 h-3.5 text-red-400" />;
  if (['doc', 'docx', 'txt'].includes(ext))
    return <FileText className="w-3.5 h-3.5 text-sys-green" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext))
    return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
  return <File className="w-3.5 h-3.5 text-zinc-400" />;
};



// ── Relative time helper ──────────────────────────────────────────────────────
function relativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 48) return 'Yesterday';
  return `${Math.floor(diffH / 24)}d ago`;
}

// ── File Entry ────────────────────────────────────────────────────────────────
const FileEntry: React.FC<{
  file: any;
  onRemove: () => void;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ file, onRemove, isSelected, onToggle }) => {
  const filename = file.name || file.filename || `Document #${file.id}`;
  // Prefer source_url (the original YouTube link) over filename (which may be the video title)
  const youtubeVideoId =
    (file.source_url ? getYoutubeVideoIdFromFilename(file.source_url as string) : null)
    ?? getYoutubeVideoIdFromFilename(filename);
  const thumbnailUrl = youtubeVideoId ? getYoutubeThumbnailUrl(youtubeVideoId, 'hq') : null;
  const watchUrl = youtubeVideoId ? `https://www.youtube.com/watch?v=${youtubeVideoId}` : null;

  // ── YouTube card ──────────────────────────────────────────────────────────
  if (youtubeVideoId) {
    return (
      <div
        onClick={onToggle}
        className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer
          border transition-all duration-200
          ${isSelected
            ? 'border-sys-green/40 ring-1 ring-sys-green/20'
            : 'border-sys-border hover:border-red-500/40'
          }`}
        style={{ background: 'rgba(17,24,39,0.9)' }}
      >
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={filename}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={e => {
                // Try maxres fallback, then hide
                const el = e.currentTarget;
                if (el.src.includes('hqdefault')) {
                  el.src = getYoutubeThumbnailUrl(youtubeVideoId, 'maxres');
                } else {
                  el.style.display = 'none';
                }
              }}
            />
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center
            bg-black/30 group-hover:bg-black/50 transition-colors duration-200">
            <a
              href={watchUrl!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ background: 'rgba(255,0,0,0.9)', boxShadow: '0 0 16px rgba(255,0,0,0.5)' }}
              title="Watch on YouTube"
            >
              {/* Play triangle */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </a>
          </div>

          {/* YouTube badge */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.75)' }}>
            <Youtube className="w-3 h-3 text-red-500" />
            <span className="text-[9px] font-bold text-white font-mono">YOUTUBE</span>
          </div>

          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: '#76b900' }}>
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-[#020617]">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between px-2.5 py-2 gap-2">
          <p className="text-[11px] font-medium text-foreground truncate leading-tight flex-1">
            {filename}
          </p>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100
              text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Remove"
          >
            <Trash className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // ── Standard document entry ────────────────────────────────────────────────
  return (
    <div
      onClick={onToggle}
      className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg
        transition-all cursor-pointer border
        ${isSelected
          ? 'bg-sys-green/10 border-sys-green/30'
          : 'border-transparent hover:bg-white/5 hover:border-sys-border'
        }`}
    >
      <div className="shrink-0 w-7 h-7 rounded-md bg-white/5 border border-sys-border flex items-center justify-center">
        {getFileIcon(filename)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-foreground truncate leading-tight">{filename}</p>
        {file.size && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground
          hover:text-red-400 hover:bg-red-500/10 transition-all"
        title="Delete"
      >
        <Trash className="w-3 h-3" />
      </button>
    </div>
  );
};


// ── Chat Item ─────────────────────────────────────────────────────────────────
interface ChatItemProps {
  session:   ChatSession;
  isActive:  boolean;
  isLoading: boolean;
  onSelect:  () => void;
  onDelete:  () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ session, isActive, isLoading, onSelect, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(menuRef as React.RefObject<HTMLElement>, () => setMenuOpen(false));

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg
        cursor-pointer transition-all duration-200 border
        ${isActive
          ? 'bg-sys-green/8 border-sys-green/20 text-foreground'
          : 'border-transparent text-muted-foreground hover:bg-white/4 hover:text-foreground hover:border-sys-border'
        }`}
      style={isActive ? { background: 'rgba(118,185,0,0.07)', borderLeftColor: 'rgba(118,185,0,0.3)' } : {}}
    >
      {/* Left accent bar for active */}
      {isActive && (
        <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sys-green" />
      )}

      <div className="flex items-center gap-2.5 flex-1 min-w-0 pl-1.5">
        <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center
          ${isActive ? 'bg-sys-green/15' : 'bg-white/5'}`}>
          {isActive && isLoading
            ? <Loader2 className="w-3 h-3 text-sys-green animate-spin" />
            : <MessageSquare className={`w-3 h-3 ${isActive ? 'text-sys-green' : 'text-muted-foreground group-hover:text-foreground'}`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate font-medium">{session.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            {relativeTime(session.updated_at || session.created_at)}
          </p>
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
        className={`shrink-0 p-1 rounded transition-all
          ${menuOpen
            ? 'opacity-100 bg-white/8 text-foreground'
            : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-white/8 hover:text-foreground'
          }`}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          onClick={e => e.stopPropagation()}
          className="absolute right-2 top-10 w-44 py-1.5 rounded-xl z-50
            bg-popover border border-sys-border shadow-premium-dark
            backdrop-blur-xl flex flex-col text-xs overflow-hidden"
        >
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors text-left">
            <Pin className="w-3.5 h-3.5 text-muted-foreground" /> Pin conversation
          </button>
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors text-left">
            <Share className="w-3.5 h-3.5 text-muted-foreground" /> Share
          </button>
          <div className="h-px bg-sys-border my-1 mx-2" />
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors text-left"
          >
            <Trash className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ── Section Label ─────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <p className="system-label px-3 pt-4 pb-2 select-none">{label}</p>
);

// ── Session List ──────────────────────────────────────────────────────────────
const SessionListContent: React.FC<{
  sessions:       ChatSession[];
  sessionId:      number | null;
  isLoading:      boolean;
  sessionLoading: boolean;
  onSelect:       (id: number) => void;
  onDelete:       (id: number) => void;
}> = ({ sessions, sessionId, isLoading, sessionLoading, onSelect, onDelete }) => {
  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="w-3 h-3 animate-spin text-sys-green" />
        <span className="text-[11px] text-muted-foreground font-mono">Initializing…</span>
      </div>
    );
  }
  if (sessions.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground px-3 py-2 font-mono">
        // No sessions yet
      </p>
    );
  }
  return (
    <>
      {sessions.map(session => (
        <ChatItem
          key={session.id}
          session={session}
          isActive={session.id === sessionId}
          isLoading={sessionLoading && session.id === sessionId}
          onSelect={() => onSelect(session.id)}
          onDelete={() => onDelete(session.id)}
        />
      ))}
    </>
  );
};

// ── Main Sidebar ──────────────────────────────────────────────────────────────
interface Props {
  open:    boolean;
  onClose: () => void;
  onOpen:  () => void;
  onOpenKnowledgeBase: () => void;
}

export const Sidebar: React.FC<Props> = memo(({ open, onClose, onOpen, onOpenKnowledgeBase }) => {
  const {
    documents, deleteDocument, fetchDocuments,
    sessions, fetchSessions, createSession, deleteSession, switchSession,
    sessionId, sessionLoading, clearHistory,
    isLoading, processingTasks,
    selectedDocumentIds, toggleSelectedDocument,
  } = useRagContext();

  const [sourcesOpen, setSourcesOpen] = useState(false);

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchSessions();
  }, [fetchDocuments, fetchSessions]);

  const handleNewChat = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    clearHistory();
    await createSession();
    setCreating(false);
  }, [clearHistory, createSession, creating]);

  const handleDeleteSession = useCallback(async (id: number) => {
    await deleteSession(id);
    if (sessions.length <= 1) await createSession();
  }, [deleteSession, sessions.length, createSession]);

  const handleSelectSession = useCallback(async (id: number) => {
    if (id === sessionId) return;
    await switchSession(id);
  }, [switchSession, sessionId]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Spacer for desktop layout */}
      <div className={`hidden lg:block shrink-0 transition-[width] duration-300
        ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'w-[280px]' : 'w-0'}`} />

      <aside className={`
        fixed top-0 left-0 h-full z-30 flex flex-col w-[280px]
        border-r border-sys-border
        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{
          background: 'rgba(15,23,42,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.5), inset -1px 0 0 rgba(118,185,0,0.05)',
        }}
      >
        {/* Subtle top cyan shimmer */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sys-green/30 to-transparent" />

        {/* ── AI Identity Header ──────────────────────────────────────────── */}
        <div className="relative px-4 pt-5 pb-4 shrink-0 border-b border-sys-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo / Pulse */}
              <div className="relative w-9 h-9 shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-sys-green/25"
                  style={{ background: 'rgba(118,185,0,0.08)', boxShadow: '0 0 12px rgba(118,185,0,0.2)' }}>
                  <img src="/images/vaathi.png" alt="Vaathi" className="w-full h-full object-contain p-1" />
                </div>
                {/* Status pulse */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-sys-success border-2 border-[#0F172A] status-ping" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                    VAATHI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="system-label" style={{ fontSize: '9px' }}>AI RESEARCH SYSTEM</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sys-success animate-pulse" />
                  <span className="system-label text-sys-success" style={{ fontSize: '9px', color: '#22C55E' }}>STATUS: ONLINE</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              title="Close sidebar"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── New Session Button ──────────────────────────────────────────── */}
        <div className="px-3 py-3 shrink-0">
          <button
            onClick={handleNewChat}
            disabled={creating}
            className="group flex items-center justify-between w-full px-4 py-2.5 rounded-xl
              font-semibold text-sm text-[#020617]
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #76b900 0%, #4A7A00 100%)',
              boxShadow: '0 0 15px rgba(118,185,0,0.3), 0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>New Session</span>
            </div>
            <Plus className="w-4 h-4 opacity-70 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>



        {/* ── Conversations ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin">
          <SectionLabel label="Conversations" />
          <SessionListContent
            sessions={sessions}
            sessionId={sessionId}
            isLoading={isLoading}
            sessionLoading={sessionLoading}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
          />
        </div>

        {/* ── Knowledge Base ──────────────────────────────────────────────── */}
        <div className="border-t border-sys-border flex flex-col shrink-0">
          <button
            onClick={() => setSourcesOpen(o => !o)}
            className="flex items-center justify-between w-full px-4 py-3 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Database className="w-3.5 h-3.5 text-sys-success" />
              </div>
              <span className="text-sm font-semibold text-foreground">Knowledge Base</span>
            </div>
            <div className="flex items-center gap-2">
              {processingTasks.length > 0 && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sys-green" />
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono
                ${documents.length > 0 || processingTasks.length > 0
                  ? 'text-sys-success border border-sys-success/30'
                  : 'text-muted-foreground border border-sys-border'
                }`}
                style={documents.length > 0 || processingTasks.length > 0 ? { background: 'rgba(34,197,94,0.1)' } : { background: 'rgba(255,255,255,0.04)' }}>
                {documents.length + processingTasks.length}
              </span>
              {/* Expand to full page */}
              <button
                onClick={e => { e.stopPropagation(); onOpenKnowledgeBase(); }}
                className="p-1 rounded hover:bg-sys-success/10 text-muted-foreground hover:text-sys-success transition-colors"
                title="Open Knowledge Base"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200
                ${sourcesOpen ? 'rotate-0' : '-rotate-90'}`} />
            </div>
          </button>

          {sourcesOpen && (
            <div className="overflow-y-auto px-2 pb-3 space-y-0.5 max-h-[32vh]
              scrollbar-thin animate-in slide-in-from-bottom-2 fade-in duration-200">
              
              {processingTasks.map(taskId => (
                <div key={taskId} className="group relative flex items-center gap-2.5 px-3 py-2 rounded-lg border border-sys-green/30 bg-sys-green/5">
                  <div className="shrink-0 w-7 h-7 rounded-md bg-white/5 border border-sys-green/30 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-sys-green animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-sys-green truncate leading-tight">Processing document...</p>
                    <p className="text-[10px] text-sys-green/70 mt-0.5">Please wait</p>
                  </div>
                </div>
              ))}

              {documents.length === 0 && processingTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1E293B' }}>
                    <BookOpen className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {isLoading ? '// Loading sources…' : '// No sources uploaded'}
                  </p>
                  {!isLoading && (
                    <p className="text-[10px] text-muted-foreground/60">
                      Drop files into chat to add knowledge
                    </p>
                  )}
                </div>
              ) : (
                documents.map(doc => (
                  <FileEntry
                    key={doc.id}
                    file={doc}
                    isSelected={selectedDocumentIds.includes(doc.id)}
                    onToggle={() => toggleSelectedDocument(doc.id)}
                    onRemove={() => deleteDocument(doc.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Footer — User Profile ────────────────────────────────────────── */}
        <div className="border-t border-sys-border px-4 py-3 shrink-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#020617] text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #76b900, #4A7A00)',
              boxShadow: '0 0 8px rgba(118,185,0,0.3)',
            }}>
            D
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">Dhanush</p>
            <p className="system-label" style={{ fontSize: '9px' }}>OPERATOR · VAATHI OS</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-sys-success animate-pulse shrink-0" />
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';