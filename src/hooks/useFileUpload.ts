import { useCallback, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { generateId } from '../utils';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.docx'];
const ALLOWED_MIME = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const useFileUpload = () => {
  const { addFile, updateFile } = useChat();
  const [isDragging, setIsDragging] = useState(false);

  const isAllowed = (file: File) =>
    ALLOWED_MIME.includes(file.type) ||
    ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));

  const uploadFile = useCallback(
    async (file: File) => {
      if (!isAllowed(file)) {
        console.warn(`File type not allowed: ${file.name}`);
        return;
      }

      const id = generateId();
      addFile({
        id,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        status: 'uploading',
        progress: 0,
        uploadedAt: new Date(),
      });

      // Simulate incremental progress while uploading
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 15, 85);
        updateFile(id, { progress: Math.round(progress) });
      }, 250);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/documents/upload`, {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          throw new Error(`Upload failed with status ${res.status}`);
        }

        updateFile(id, { status: 'done', progress: 100 });
      } catch (err) {
        clearInterval(progressInterval);
        console.error('Upload error:', err);
        updateFile(id, { status: 'error', progress: 0 });
      }
    },
    [addFile, updateFile]
  );

  const uploadFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the root container
    if (!(e.currentTarget as Node).contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles]
  );

  return {
    isDragging,
    uploadFile,
    uploadFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
};
