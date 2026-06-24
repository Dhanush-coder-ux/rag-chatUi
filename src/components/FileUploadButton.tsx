import React, { useRef, useCallback, useState } from 'react';
import { Paperclip, Upload, Loader2 } from 'lucide-react';
import { useRagContext } from '../context/RagContext'; // Ensure this path matches your project structure

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

export const FileUploadButton: React.FC = () => {
  const { uploadDocument, processingTasks } = useRagContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    // Filter to only allow specified types or specific extensions
    const validFiles = Array.from(files).filter(f => 
      ALLOWED_TYPES.includes(f.type) || 
      f.name.endsWith('.md') || 
      f.name.endsWith('.txt') ||
      f.name.endsWith('.csv') ||
      f.name.endsWith('.xlsx') ||
      f.name.endsWith('.xls')
    );

    if (validFiles.length === 0) return;

    setIsUploading(true);
    // Process uploads sequentially through the context
    for (const file of validFiles) {
      await uploadDocument(file);
    }
    setIsUploading(false);

    // Reset the input so the user can select the same file again if needed
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [uploadDocument]);

  const isActive = isUploading || processingTasks.length > 0;

  return (
    <div className="relative flex items-center justify-center">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.docx,.xlsx,.xls,.csv"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
        aria-label="Upload files"
      />
      
      {/* Floating Status Pill */}
      {isActive && (
        <div className="absolute bottom-full left-0 mb-3 whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sys-green/30 shadow-[0_0_15px_rgba(118,185,0,0.2)] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 pointer-events-none z-50"
             style={{ background: 'rgba(5,10,5,0.95)', backdropFilter: 'blur(8px)' }}>
          <div className="relative flex items-center justify-center w-3.5 h-3.5">
             <div className="absolute inset-0 rounded-full border border-sys-green/40 border-t-sys-green animate-spin" />
          </div>
          <span className="text-[9px] font-mono text-sys-green font-bold tracking-widest uppercase">
            {isUploading ? 'Uploading Data...' : `Ingesting ${processingTasks.length} Doc${processingTasks.length > 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isActive}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300
          ${isActive 
            ? 'cursor-not-allowed' 
            : 'text-muted-foreground hover:text-foreground hover:bg-white/10 active:scale-95'
          }`}
        style={isActive ? {
          background: 'rgba(118,185,0,0.1)',
          boxShadow: 'inset 0 0 10px rgba(118,185,0,0.2), 0 0 15px rgba(118,185,0,0.15)',
          border: '1px solid rgba(118,185,0,0.3)',
        } : {}}
        aria-label="Attach file"
        title="Attach file"
      >
        {isActive && (
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
            {/* Spinning edge highlights for the button */}
            <div className="absolute -inset-4 opacity-50 animate-[spin_3s_linear_infinite]"
                 style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(118,185,0,0.8) 100%)' }} />
            <div className="absolute inset-[1px] bg-black rounded-[11px]" />
          </div>
        )}

        <div className="relative z-10 flex items-center justify-center">
          {isActive ? (
             <Upload className="w-4 h-4 text-sys-green animate-pulse" />
          ) : (
             <Paperclip className="w-4.5 h-4.5" />
          )}
        </div>
      </button>
    </div>
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
      bg-background/80 backdrop-blur-sm rounded-2xl
      border-2 border-dashed border-primary
      transition-all pointer-events-none"
    >
      <Upload className="w-10 h-10 text-primary" />
      <p className="text-sm font-medium text-primary">
        Drop files to upload
      </p>
    </div>
  );
};