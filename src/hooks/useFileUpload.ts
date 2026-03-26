import { useCallback, useState } from 'react';
import { useRagContext } from '../context/RagContext'; // Updated import

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.docx'];
const ALLOWED_MIME = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const useFileUpload = () => {
  const { uploadDocument } = useRagContext();
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

      try {
        // Delegate the actual upload to the RagContext
        await uploadDocument(file);
      } catch (err) {
        console.error('Upload error:', err);
      }
    },
    [uploadDocument]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      // Process dropped files sequentially so we don't overwhelm the backend
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
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