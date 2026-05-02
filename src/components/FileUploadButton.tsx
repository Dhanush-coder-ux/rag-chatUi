import React, { useRef, useCallback } from 'react';
import { Paperclip, Upload, Loader2 } from 'lucide-react';
import { useRagContext } from '../context/RagContext'; // Ensure this path matches your project structure

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const FileUploadButton: React.FC = () => {
  const { uploadDocument, isLoading } = useRagContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    // Filter to only allow specified types or specific extensions
    const validFiles = Array.from(files).filter(f => 
      ALLOWED_TYPES.includes(f.type) || f.name.endsWith('.md') || f.name.endsWith('.txt')
    );

    // Process uploads sequentially through the context
    for (const file of validFiles) {
      await uploadDocument(file);
    }

    // Reset the input so the user can select the same file again if needed
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [uploadDocument]);

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
        disabled={isLoading}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors
          ${isLoading 
            ? 'text-muted-foreground/50 cursor-not-allowed' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        aria-label="Attach file"
        title="Attach file"
      >
        {isLoading ? (
          <Loader2 className="w-4.5 h-4.5 animate-spin" />
        ) : (
          <Paperclip className="w-4.5 h-4.5" />
        )}
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