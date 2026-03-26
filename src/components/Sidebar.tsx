import React, { memo, useState, useRef, useEffect } from 'react';
import {
  Plus, Trash, MessageSquare, FileText, X, Loader2, 
  MoreHorizontal, Pin, Share, ExternalLink,
  PanelLeftClose, PanelLeft, ChevronRight, ChevronDown,
  FileSpreadsheet, Image as ImageIcon, File
} from 'lucide-react';
import { useRagContext } from '../context/RagContext';
import { formatFileSize } from '../utils'; 

// ── Dropdown Hook for closing on outside click ───────────────────────────────
function useOutsideClick(ref: React.RefObject<HTMLElement>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

// ── Helper: Get Specific File Icon ───────────────────────────────────────────
const getFileIcon = (filename: string) => {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  }
  if (['pdf'].includes(ext)) {
    return <FileText className="w-4 h-4 text-red-500" />;
  }
  if (['doc', 'docx', 'txt'].includes(ext)) {
    return <FileText className="w-4 h-4 text-blue-500" />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-purple-500" />;
  }
  
  return <File className="w-4 h-4 text-zinc-500" />;
};

// ── Document / Source Entry ──────────────────────────────────────────────────
const FileEntry: React.FC<{ file: any; onRemove: () => void; onView: () => void }> = ({ file, onRemove, onView }) => {
  const filename = file.name || file.filename || `Document #${file.id}`;

  return (
    <div className="group relative flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer">
      <div className="flex items-center gap-3 flex-1 min-w-0" onClick={onView}>
        <div className="shrink-0 flex items-center justify-center">
          {getFileIcon(filename)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">
            {filename}
          </p>
          {file.size && (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {formatFileSize(file.size)}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="View Document"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Delete Document"
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ── Chat Item ────────────────────────────────────────────────────────────────
const ChatItem: React.FC<{ title: string; isActive?: boolean }> = ({ title, isActive }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(menuRef, () => setMenuOpen(false));

  return (
    <div className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-zinc-200/50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <MessageSquare className="shrink-0 w-4 h-4" />
        <p className="text-sm truncate">{title}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className={`shrink-0 p-1 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors ${menuOpen ? 'opacity-100 bg-zinc-300 dark:bg-zinc-700' : 'opacity-0 group-hover:opacity-100'}`}>
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {menuOpen && (
        <div ref={menuRef} className="absolute right-2 top-10 w-40 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl z-50 flex flex-col text-sm" onClick={(e) => e.stopPropagation()}>
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-left"><Pin className="w-3.5 h-3.5" /> Pin</button>
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-left"><Share className="w-3.5 h-3.5" /> Share</button>
          <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-1"></div>
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-left"><Trash className="w-3.5 h-3.5" /> Delete</button>
        </div>
      )}
    </div>
  );
};

// ── Main Sidebar ─────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const Sidebar: React.FC<Props> = memo(({ open, onClose, onOpen }) => {
  const { documents, deleteDocument, fetchDocuments, isLoading } = useRagContext();
  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleNewChat = () => window.location.reload(); 

  const handleViewDocument = (docId: number) => {
    const backendUrl = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:8000';
    window.open(`${backendUrl}/documents/${docId}`, '_blank');
  };

  return (
    <>
      {/* Floating Open Button (Visible ONLY when sidebar is closed) */}
      {!open && (
        <button
          onClick={onOpen}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
          aria-label="Open sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Desktop Layout Placeholder (Pushes main content smoothly) */}
      <div 
        className={`hidden lg:block shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'w-[280px]' : 'w-0'}`} 
      />

      {/* Actual Sidebar Panel (Fixed, slides over on mobile, perfectly aligns with placeholder on desktop) */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          w-[280px] bg-zinc-50 dark:bg-[#1E1F22] border-r border-zinc-200 dark:border-zinc-800/50
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header: Logo & Close Button */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <img 
                src="/images/vaathi.png" 
                alt="Vaathi Logo" 
                className="w-full h-full object-contain p-0.5" 
              />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight text-sm">Vaathi</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Top Section: "New Chat" Pill Button */}
        <div className="px-3 pb-2">
          <button
            onClick={handleNewChat}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-100 transition-colors"
          >
            <span className="text-sm font-medium">New chat</span>
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Chats Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          <p className="text-xs font-semibold text-zinc-500 px-3 pb-2 pt-2 mt-2">Recent</p>
          
          <div className="relative">
            <ChatItem title="Current Research Session" isActive={true} />
            {isLoading && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              </div>
            )}
          </div>
        </div>

        {/* Expandable Sources / Knowledge Base Section */}
        <div className="border-t border-zinc-200 dark:border-zinc-800/50 flex flex-col mt-auto transition-all duration-300">
          <button 
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="flex items-center justify-between w-full px-4 py-4 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              {sourcesOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Your Sources</span>
            </div>
            <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          </button>
          
          {/* Expanded Documents List */}
          {sourcesOpen && (
            <div className="overflow-y-auto px-3 pb-4 space-y-1 max-h-[35vh] scrollbar-thin animate-in slide-in-from-bottom-2 fade-in duration-200">
              {documents.length === 0 ? (
                <p className="py-4 text-xs text-zinc-400 text-center">
                  {isLoading ? "Loading sources..." : "No sources added yet"}
                </p>
              ) : (
                documents.map(doc => (
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
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';