import React, { memo } from 'react';
import {
  Plus, Trash2, MessageSquare, FileText, X,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { formatFileSize, formatTimestamp } from '../utils';
import { UploadedFile } from '../types';

// ── File entry in sidebar ────────────────────────────────────────────────────

const FileEntry: React.FC<{ file: UploadedFile; onRemove: () => void }> = ({ file, onRemove }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
    <div className="shrink-0 w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
      <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{file.name}</p>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{formatFileSize(file.size)}</p>
      {file.status === 'uploading' && (
        <div className="mt-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
    </div>
    <div className="shrink-0 flex items-center gap-1">
      {file.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />}
      {file.status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
      {file.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-red-500 transition-all"
        aria-label={`Remove ${file.name}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  </div>
);

// ── Main Sidebar ─────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<Props> = memo(({ open, onClose }) => {
  const {
    state,
    activeConversation,
    startNewConversation,
    deleteConversation,
    setActiveConversation,
    removeFile,
  } = useChat();

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          w-72 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:flex
        `}
        aria-label="Sidebar"
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">
              RAG Assistant
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 py-3">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium
              bg-gradient-to-br from-violet-600 to-indigo-600 text-white
              hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98]
              transition-all duration-150 shadow-sm"
            aria-label="New conversation"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New conversation
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {state.conversations.length === 0 ? (
            <p className="px-3 py-4 text-xs text-zinc-400 dark:text-zinc-500 text-center">
              No conversations yet
            </p>
          ) : (
            state.conversations.map(conv => {
              const isActive = conv.id === state.activeConversationId;
              return (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors
                    ${isActive
                      ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  onClick={() => setActiveConversation(conv.id)}
                  role="button"
                  aria-label={`Open conversation: ${conv.title}`}
                  aria-pressed={isActive}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setActiveConversation(conv.id)}
                >
                  <MessageSquare className={`shrink-0 w-3.5 h-3.5 ${isActive ? 'text-violet-500' : 'text-zinc-400 dark:text-zinc-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{conv.title}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {formatTimestamp(conv.updatedAt)}
                      {conv.messages.length > 0 && ` · ${conv.messages.length} msgs`}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    aria-label={`Delete conversation: ${conv.title}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Documents section */}
        {state.uploadedFiles.length > 0 && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1 mb-2">
              Documents ({state.uploadedFiles.length})
            </p>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {state.uploadedFiles.map(f => (
                <FileEntry key={f.id} file={f} onRemove={() => removeFile(f.id)} />
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
