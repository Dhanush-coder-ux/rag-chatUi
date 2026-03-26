import React, { memo, useState, useRef, useEffect } from 'react';
import {
  Plus, Trash, MessageSquare, FileText, X, Loader2,
  MoreHorizontal, Pin, Share, ExternalLink,
  PanelLeftClose, ChevronDown,
  FileSpreadsheet, Image as ImageIcon, File, Sparkles, Database,
   BookOpen
} from 'lucide-react';
import { useRagContext } from '../context/RagContext';
import { formatFileSize } from '../utils';

// ── Dropdown Hook ─────────────────────────────────────────────────────────────
function useOutsideClick(ref: React.RefObject<HTMLElement>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
}

// ── File Icon Helper ──────────────────────────────────────────────────────────
const getFileIcon = (filename: string) => {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
  if (['pdf'].includes(ext))
    return <FileText className="w-3.5 h-3.5 text-rose-400" />;
  if (['doc', 'docx', 'txt'].includes(ext))
    return <FileText className="w-3.5 h-3.5 text-sky-400" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext))
    return <ImageIcon className="w-3.5 h-3.5 text-violet-400" />;
  return <File className="w-3.5 h-3.5 text-zinc-400" />;
};

// ── File Entry ────────────────────────────────────────────────────────────────
const FileEntry: React.FC<{ file: any; onRemove: () => void; onView: () => void }> = ({
  file, onRemove, onView,
}) => {
  const filename = file.name || file.filename || `Document #${file.id}`;

  return (
    <div className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
      hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer
      border border-transparent hover:border-zinc-200 dark:hover:border-white/10">
      {/* File type badge */}
      <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5
        border border-zinc-200 dark:border-white/10 flex items-center justify-center">
        {getFileIcon(filename)}
      </div>

      <div className="flex-1 min-w-0" onClick={onView}>
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate leading-tight">{filename}</p>
        {file.size && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{formatFileSize(file.size)}</p>
        )}
      </div>

      {/* Hover actions */}
      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500
            hover:text-zinc-700 dark:hover:text-zinc-200
            hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
          title="View Document"
        >
          <ExternalLink className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
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

// ── Chat Item ─────────────────────────────────────────────────────────────────
const ChatItem: React.FC<{ title: string; isActive?: boolean }> = ({ title, isActive }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(menuRef, () => setMenuOpen(false));

  return (
    <div
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl
        cursor-pointer transition-all duration-200
        ${isActive
          ? 'bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/25 text-zinc-800 dark:text-zinc-100'
          : 'border border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-200 dark:hover:border-white/8'
        }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
          ${isActive ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-zinc-100 dark:bg-white/5'}`}>
          <MessageSquare className={`w-3.5 h-3.5 ${isActive
            ? 'text-violet-500 dark:text-violet-400'
            : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-zinc-400'}`} />
        </div>
        <p className="text-xs truncate font-medium">{title}</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
        className={`shrink-0 p-1.5 rounded-lg transition-all
          ${menuOpen
            ? 'opacity-100 bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-200'
            : 'opacity-0 group-hover:opacity-100 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-10 w-44 py-1.5 rounded-xl z-50
            bg-white dark:bg-[#1a1b1e]
            border border-zinc-200 dark:border-white/10
            shadow-xl dark:shadow-2xl dark:shadow-black/50
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
          <button className="flex items-center gap-2 px-3 py-2
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

// ── Section Header ────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 px-3 pt-4 pb-2 select-none">
    {label}
  </p>
);

// ── Main Sidebar ──────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const Sidebar: React.FC<Props> = memo(({ open, onClose, onOpen }) => {
  const { documents, deleteDocument, fetchDocuments, isLoading } = useRagContext();
  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleNewChat = () => window.location.reload();

  const handleViewDocument = (docId: number) => {
    const backendUrl = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:8000';
    window.open(`${backendUrl}/documents/${docId}`, '_blank');
  };

  return (
    <>
      {/* ── Mobile backdrop ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* ── Desktop layout spacer ────────────────────────────────────────── */}
      <div
        className={`hidden lg:block shrink-0 transition-[width] duration-300
          ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'w-[272px]' : 'w-0'}`}
      />

      {/* ── Sidebar panel ───────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col w-[272px]
          bg-zinc-50 dark:bg-[#111113]
          border-r border-zinc-200 dark:border-white/8
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Subtle gradient mesh at top */}
        <div
          className="absolute top-0 inset-x-0 h-48 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.12) 0%, transparent 70%)',
          }}
        />

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-between px-4 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600
              flex items-center justify-center shadow-lg shadow-violet-500/25 overflow-hidden border border-violet-400/20">
              <img
                src="/images/vaathi.png"
                alt="Vaathi"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-white tracking-tight text-sm leading-none block">Vaathi</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-none mt-0.5 block">AI Research Assistant</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-600
              hover:text-zinc-700 dark:hover:text-zinc-300
              hover:bg-zinc-200 dark:hover:bg-white/8 transition-colors"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* ── New Chat Button ────────────────────────────────────────────── */}
        <div className="relative px-3 pb-3 shrink-0">
          <button
            onClick={handleNewChat}
            className="group flex items-center justify-between w-full px-4 py-3 rounded-xl
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:from-violet-500 hover:to-indigo-500
              text-white font-semibold text-sm
              shadow-lg shadow-violet-500/20
              transition-all duration-200 hover:shadow-violet-500/30 hover:scale-[1.01]
              border border-violet-500/30"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 opacity-80" />
              <span>New Chat</span>
            </div>
            <Plus className="w-4 h-4 opacity-70 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="h-px bg-zinc-200 dark:bg-white/6 mx-3 shrink-0" />

        {/* ── Chat History ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin
          scrollbar-thumb-zinc-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
          <SectionLabel label="Recent" />

          <div className="relative">
            <ChatItem title="Current Research Session" isActive={true} />
            {isLoading && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
              </div>
            )}
          </div>
        </div>

        {/* ── Knowledge Base / Sources Panel ────────────────────────────── */}
        <div className="border-t border-zinc-200 dark:border-white/6 flex flex-col shrink-0">
          {/* Collapsible header */}
          <button
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="flex items-center justify-between w-full px-4 py-3.5
              hover:bg-zinc-100 dark:hover:bg-white/4 transition-colors group"
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
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200
                  ${sourcesOpen ? 'rotate-0' : '-rotate-90'}`}
              />
            </div>
          </button>

          {/* Expanded document list */}
          {sourcesOpen && (
            <div
              className="overflow-y-auto px-2 pb-3 space-y-0.5 max-h-[38vh]
                scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent
                animate-in slide-in-from-bottom-2 fade-in duration-200"
            >
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
                documents.map((doc) => (
                  <FileEntry
                    key={doc.id}
                    file={doc}
                    onRemove={() => deleteDocument(doc.id)}
                    onView={() => handleViewDocument(doc.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Bottom footer ─────────────────────────────────────────────── */}
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