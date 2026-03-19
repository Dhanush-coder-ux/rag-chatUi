import React, { useRef, useCallback, useState } from 'react';
import { Paperclip, Upload } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { generateId, formatFileSize } from '../utils';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const FileUploadButton: React.FC = () => {
  const { addFile, updateFile } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    const id = generateId();
    addFile({
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      uploadedAt: new Date(),
    });

    // Simulate chunked progress
    const tick = setInterval(() => {
      updateFile(id, { progress: Math.min(90, Math.random() * 20 + 70) });
    }, 200);

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/documents/upload`, { method: 'POST', body: form });
      clearInterval(tick);
      if (!res.ok) throw new Error('Upload failed');
      updateFile(id, { status: 'done', progress: 100 });
    } catch {
      clearInterval(tick);
      updateFile(id, { status: 'error', progress: 0 });
    }
  }, [addFile, updateFile]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => {
      if (ALLOWED_TYPES.includes(f.type) || f.name.endsWith('.md') || f.name.endsWith('.txt')) {
        uploadFile(f);
      }
    });
  }, [uploadFile]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.docx"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
        aria-label="Upload files"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center w-9 h-9 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Attach file"
        title="Attach file"
      >
        <Paperclip className="w-4.5 h-4.5" />
      </button>
    </>
  );
};

// ── Drag-and-drop overlay ──────────────────────────────────────────────────

export const DropZoneOverlay: React.FC<{
  visible: boolean;
  onDrop: (files: FileList) => void;
}> = ({ visible, onDrop }) => {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4
      bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm rounded-2xl
      border-2 border-dashed border-violet-400 dark:border-violet-500
      transition-all pointer-events-none"
    >
      <Upload className="w-10 h-10 text-violet-500" />
      <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
        Drop files to upload
      </p>
    </div>
  );
};
