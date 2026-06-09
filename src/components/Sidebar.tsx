// components/Sidebar.tsx
import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Trash, MessageSquare, FileText,
  Loader2, MoreHorizontal, Pin, Share,
  PanelLeftClose, ChevronDown,
  FileSpreadsheet, Image as ImageIcon, File, Sparkles, Database,
  BookOpen, Youtube,
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
    return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
  if (ext === 'pdf')
    return <FileText className="w-3.5 h-3.5 text-rose-400" />;
  if (['doc', 'docx', 'txt'].includes(ext))
    return <FileText className="w-3.5 h-3.5 text-sky-400" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext))
    return <ImageIcon className="w-3.5 h-3.5 text-violet-400" />;
  return <File className="w-3.5 h-3.5 text-zinc-400" />;
};

const FileEntry: React.FC<{ file: any; onRemove: () => void; isSelected: boolean; onToggle: () => void }> = ({ file, onRemove, isSelected, onToggle }) => {
  const filename = file.name || file.filename || `Document #${file.id}`;
  const youtubeVideoId = getYoutubeVideoIdFromFilename(filename);
  const thumbnailUrl = youtubeVideoId ? getYoutubeThumbnailUrl(youtubeVideoId, 'hq') : null;

  if (youtubeVideoId && thumbnailUrl) {
    return (
      <div 
        onClick={onToggle}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all cursor-pointer border
        ${isSelected 
          ? 'bg-primary/10 border-primary/30 shadow-sm' 
          : 'border-transparent hover:bg-zinc-100 dark:hover:bg-white/5 hover:border-zinc-200 dark:hover:border-white/10'}`}>
        <div className="shrink-0 w-16 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
          <img
            src={thumbnailUrl}
            alt={filename}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors">
            <Youtube className="w-4 h-4 text-red-500" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate leading-tight">{filename}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">YouTube Video</p>
        </div>
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500
              hover:text-rose-500 dark:hover:text-rose-400
              hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            title="Delete"
          >
            <Trash className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onToggle}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
      transition-all cursor-pointer border
      ${isSelected 
        ? 'bg-primary/10 border-primary/30 shadow-sm' 
        : 'border-transparent hover:bg-zinc-100 dark:hover:bg-white/5 hover:border-zinc-200 dark:hover:border-white/10'}`}>
      <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5
        border border-zinc-200 dark:border-white/10 flex items-center justify-center">
        {getFileIcon(filename)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate leading-tight">{filename}</p>
        {file.size && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{formatFileSize(file.size)}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500
            hover:text-rose-500 dark:hover:text-rose-400
            hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          title="Delete"
        >
          <Trash className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

interface ChatItemProps {
  session:   ChatSession;
  isActive:  boolean;
  isLoading: boolean;           // true while this session's messages are loading
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
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl
        cursor-pointer transition-all duration-200
        ${isActive
          ? 'bg-primary/10 border border-primary/20 text-foreground'
          : 'border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border'
        }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
          ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
          {/* Show spinner in the icon slot while loading this session */}
          {isActive && isLoading
            ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            : <MessageSquare className={`w-3.5 h-3.5 ${isActive
                ? 'text-primary'
                : 'text-muted-foreground group-hover:text-foreground'}`} />
          }
        </div>
        <p className="text-xs truncate font-medium">{session.title}</p>
      </div>

      <button
        onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
        className={`shrink-0 p-1.5 rounded-lg transition-all
          ${menuOpen
            ? 'opacity-100 bg-muted text-foreground'
            : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          onClick={e => e.stopPropagation()}
          className="absolute right-2 top-10 w-44 py-1.5 rounded-xl z-50
            bg-popover
            border border-border
            shadow-xl
            backdrop-blur-xl flex flex-col text-xs overflow-hidden"
        >
          <button className="flex items-center gap-2 px-3 py-2
            hover:bg-zinc-50 dark:hover:bg-white/5
            text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white
            transition-colors text-left">
            <Pin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" /> Pin conversation
          </button>
          <button className="flex items-center gap-2 px-3 py-2
            hover:bg-zinc-50 dark:hover:bg-white/5
            text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white
            transition-colors text-left">
            <Share className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" /> Share
          </button>
          <div className="h-px bg-zinc-100 dark:bg-white/8 my-1 mx-2" />
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
            className="flex items-center gap-2 px-3 py-2
              hover:bg-rose-50 dark:hover:bg-rose-500/10
              text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400
              transition-colors text-left">
            <Trash className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 pt-4 pb-2 select-none">
    {label}
  </p>
);

const SessionListContent: React.FC<{
  sessions:      ChatSession[];
  sessionId:     number | null;
  isLoading:     boolean;
  sessionLoading: boolean;
  onSelect:      (id: number) => void;
  onDelete:      (id: number) => void;
}> = ({ sessions, sessionId, isLoading, sessionLoading, onSelect, onDelete }) => {
  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
        <span className="text-[11px] text-zinc-400">Loading…</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="text-[11px] text-zinc-400 dark:text-zinc-600 px-3 py-2">
        No conversations yet
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

interface Props {
  open:    boolean;
  onClose: () => void;
  onOpen:  () => void;
}

export const Sidebar: React.FC<Props> = memo(({ open, onClose, onOpen }) => {
  const {
    documents, deleteDocument, fetchDocuments,
    sessions, fetchSessions, createSession, deleteSession, switchSession,
    sessionId, sessionLoading, clearHistory,
    isLoading,
    selectedDocumentIds, toggleSelectedDocument,
  } = useRagContext();

  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchSessions();
  }, [fetchDocuments, fetchSessions]);
const [creating, setCreating] = useState(false);

const handleNewChat = useCallback(async () => {
  if (creating) return; // ✅ prevent spam

  setCreating(true);
  clearHistory();
  await createSession();
  setCreating(false);

}, [clearHistory, createSession, creating]);

  const handleDeleteSession = useCallback(async (id: number) => {
    await deleteSession(id);
    if (sessions.length <= 1) {
      await createSession();
    }
  }, [deleteSession, sessions.length, createSession]);

  // switchSession is now async — it fetches messages from the API
  const handleSelectSession = useCallback(async (id: number) => {
    if (id === sessionId) return;   // already active, no-op
    await switchSession(id);
  }, [switchSession, sessionId]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`hidden lg:block shrink-0 transition-[width] duration-300
        ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'w-[272px]' : 'w-0'}`} />

      <aside className={`
        fixed top-0 left-0 h-full z-30 flex flex-col w-[272px]
        bg-card
        border-r border-border
        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="absolute top-0 inset-x-0 h-48 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center
              shadow-lg shadow-violet-500/25 overflow-hidden border border-violet-400/20">
              <img src="/images/vaathi.png" alt="Vaathi" className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-white tracking-tight text-sm leading-none block">Vaathi</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-none mt-0.5 block">AI Research Assistant</span>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close sidebar"
            className="p-1.5 rounded-lg text-muted-foreground
              hover:text-foreground
              hover:bg-muted transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat */}
        <div className="relative px-3 pb-3 shrink-0">
          <button
            onClick={handleNewChat}
            disabled={creating}
            className="group flex items-center justify-between w-full px-4 py-3 rounded-xl
              bg-gradient-to-r from-primary to-purple-600
              hover:from-primary/90 hover:to-purple-600/90
              text-primary-foreground font-semibold text-sm
              shadow-lg shadow-primary/20
              transition-all duration-200 hover:shadow-primary/30 hover:scale-[1.01]
              border border-primary/30"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 opacity-80" />
              <span>New Chat</span>
            </div>
            <Plus className="w-4 h-4 opacity-70 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        <div className="h-px bg-zinc-200 dark:bg-white/6 mx-3 shrink-0" />

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin
          scrollbar-thumb-zinc-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
          <SectionLabel label="Recent" />
          <SessionListContent
            sessions={sessions}
            sessionId={sessionId}
            isLoading={isLoading}
            sessionLoading={sessionLoading}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
          />
        </div>

        {/* Knowledge Base */}
        <div className="border-t border-border flex flex-col shrink-0">
          <button
            onClick={() => setSourcesOpen(o => !o)}
            className="flex items-center justify-between w-full px-4 py-3.5 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10
                border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Knowledge Base</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                ${documents.length > 0
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25'
                  : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-white/10'
                }`}>
                {documents.length}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200
                ${sourcesOpen ? 'rotate-0' : '-rotate-90'}`} />
            </div>
          </button>

          {sourcesOpen && (
            <div className="overflow-y-auto px-2 pb-3 space-y-0.5 max-h-[38vh]
              scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent
              animate-in slide-in-from-bottom-2 fade-in duration-200">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/4
                    border border-zinc-200 dark:border-white/8 flex items-center justify-center mb-1">
                    <BookOpen className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
                  </div>
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    {isLoading ? 'Loading sources…' : 'No sources uploaded yet'}
                  </p>
                  {!isLoading && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
                      Drop files into the chat to add knowledge
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

        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-white/6 px-4 py-3 shrink-0 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
            flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-violet-500/20">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">User</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 truncate">Free Plan</p>
          </div>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';