// components/KnowledgeBasePage.tsx — Full-page Knowledge Base overlay
import React, { useState, useCallback, useEffect, memo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  X, Database, FileText, FileSpreadsheet, File, Youtube,
  Search, Trash, Upload, Loader2, RefreshCw,
  ExternalLink, BookOpen,
} from 'lucide-react';
import { useRagContext, Document as DocType } from '../context/RagContext';
import { PdfViewer } from './PdfViewer';
import { getYoutubeVideoIdFromFilename, getYoutubeThumbnailUrl } from '../utils';

// Use the bundled PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const API_BASE = 'http://localhost:8000';

// ── File icon helper ─────────────────────────────────────────────────────────
function getFileIcon(filename: string) {
  const ext = filename?.split('.').pop()?.toLowerCase() ?? '';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
  if (ext === 'pdf')                          return <FileText className="w-5 h-5 text-red-400" />;
  if (['doc', 'docx', 'txt'].includes(ext))  return <FileText className="w-5 h-5 text-sky-400" />;
  return <File className="w-5 h-5 text-zinc-400" />;
}

// ── PDF Thumbnail card ───────────────────────────────────────────────────────
const PdfCard: React.FC<{
  doc: DocType;
  isSelected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onOpen: () => void;
}> = ({ doc, isSelected, onToggle, onDelete, onOpen }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const fileUrl = `${API_BASE}/documents/${doc.id}/file`;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
        isSelected
          ? 'border-sys-cyan/40 ring-1 ring-sys-cyan/20'
          : 'border-sys-border hover:border-red-400/30'
      }`}
      style={{ background: 'rgba(17,24,39,0.9)' }}
      onClick={onToggle}
    >
      {/* PDF first-page thumbnail */}
      <div
        className="relative w-full bg-zinc-900 flex items-center justify-center overflow-hidden"
        style={{ height: '200px' }}
      >
        {!loadError ? (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setLoadError(true)}
            loading={
              <div className="flex items-center justify-center w-full h-full">
                <Loader2 className="w-6 h-6 text-sys-cyan animate-spin" />
              </div>
            }
            error={null}
          >
            <Page
              pageNumber={1}
              width={220}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
            />
          </Document>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <FileText className="w-10 h-10 text-red-400/60" />
            <span className="text-[10px] font-mono">No preview</span>
          </div>
        )}

        {/* Open full viewer button overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center
            bg-black/0 group-hover:bg-black/50 transition-colors duration-200 opacity-0 group-hover:opacity-100"
          onClick={e => { e.stopPropagation(); onOpen(); }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'rgba(0,229,255,0.2)', border: '1px solid rgba(0,229,255,0.4)' }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View PDF
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#00E5FF' }}
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#020617]">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
        )}

        {/* PDF badge */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.75)' }}
        >
          <FileText className="w-3 h-3 text-red-400" />
          <span className="text-[9px] font-bold text-white font-mono">PDF</span>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between px-3 py-2.5 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{doc.filename}</p>
          {numPages && (
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{numPages} pages</p>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100
            text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Delete"
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ── YouTube card ─────────────────────────────────────────────────────────────
const YoutubeCard: React.FC<{
  doc: DocType;
  isSelected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ doc, isSelected, onToggle, onDelete }) => {
  const filename = doc.filename || `Document #${doc.id}`;
  const youtubeVideoId =
    (doc.source_url ? getYoutubeVideoIdFromFilename(doc.source_url as string) : null)
    ?? getYoutubeVideoIdFromFilename(filename);
  const thumbnailUrl = youtubeVideoId ? getYoutubeThumbnailUrl(youtubeVideoId, 'hq') : null;
  const watchUrl = youtubeVideoId ? `https://www.youtube.com/watch?v=${youtubeVideoId}` : null;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
        isSelected
          ? 'border-sys-cyan/40 ring-1 ring-sys-cyan/20'
          : 'border-sys-border hover:border-red-500/30'
      }`}
      style={{ background: 'rgba(17,24,39,0.9)' }}
      onClick={onToggle}
    >
      <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={filename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
          {watchUrl && (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              style={{ background: 'rgba(255,0,0,0.9)', boxShadow: '0 0 20px rgba(255,0,0,0.5)' }}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </a>
          )}
        </div>

        {/* YouTube badge */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.75)' }}
        >
          <Youtube className="w-3 h-3 text-red-500" />
          <span className="text-[9px] font-bold text-white font-mono">YOUTUBE</span>
        </div>

        {isSelected && (
          <div
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#00E5FF' }}
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#020617]">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 gap-2">
        <p className="text-xs font-medium text-foreground truncate flex-1">{filename}</p>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100
            text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Delete"
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ── Generic file card ────────────────────────────────────────────────────────
const GenericCard: React.FC<{
  doc: DocType;
  isSelected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ doc, isSelected, onToggle, onDelete }) => {
  const filename = doc.filename || `Document #${doc.id}`;
  return (
    <div
      onClick={onToggle}
      className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-sys-cyan/40 bg-sys-cyan/8'
          : 'border-sys-border hover:border-sys-border hover:bg-white/4'
      }`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-sys-border"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        {getFileIcon(filename)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{filename}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono uppercase">
          {filename.split('.').pop() ?? 'file'} · Document
        </p>
      </div>
      {isSelected && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: '#00E5FF' }}
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#020617]">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        </div>
      )}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100
          text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
        title="Delete"
      >
        <Trash className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ── Main KnowledgeBasePage ───────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export const KnowledgeBasePage: React.FC<Props> = memo(({ onClose }) => {
  const {
    documents, deleteDocument, fetchDocuments,
    selectedDocumentIds, toggleSelectedDocument, clearSelectedDocuments,
    uploadDocument, processingTasks,
  } = useRagContext();

  const [search, setSearch]         = useState('');
  const [pdfViewerDoc, setPdfViewerDoc] = useState<DocType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDocuments();
    setIsRefreshing(false);
  }, [fetchDocuments]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadDocument(file);
    }
    e.target.value = '';
  }, [uploadDocument]);

  const filtered = documents.filter(d =>
    d.filename?.toLowerCase().includes(search.toLowerCase())
  );

  // Separate document types
  const pdfs     = filtered.filter(d => d.filename?.toLowerCase().endsWith('.pdf'));
  const youtubes = filtered.filter(d => d.source_type === 'youtube');
  const others   = filtered.filter(d =>
    !d.filename?.toLowerCase().endsWith('.pdf') && d.source_type !== 'youtube'
  );

  const pdfFileUrl = pdfViewerDoc ? `${API_BASE}/documents/${pdfViewerDoc.id}/file` : '';

  return (
    <>
      {/* ── Overlay backdrop ─────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* ── Page panel ───────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-5xl
          animate-in slide-in-from-right-8 duration-300"
        style={{
          background: 'rgba(10,17,32,0.98)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(30,41,59,1)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top shimmer */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sys-cyan/30 to-transparent" />

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-5 border-b border-sys-border shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <Database className="w-5 h-5 text-sys-success" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">Knowledge Base</h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {documents.length} source{documents.length !== 1 ? 's' : ''}
                  {processingTasks.length > 0 && ` · ${processingTasks.length} processing`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg text-muted-foreground hover:text-sys-cyan hover:bg-sys-cyan/8 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Upload */}
              <label
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
                  text-xs font-medium transition-all"
                style={{
                  background: 'rgba(0,229,255,0.1)',
                  border: '1px solid rgba(0,229,255,0.25)',
                  color: '#00E5FF',
                }}
                title="Upload PDF or TXT"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
                <input
                  type="file"
                  accept=".pdf,.txt"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {/* Clear selection */}
              {selectedDocumentIds.length > 0 && (
                <button
                  onClick={clearSelectedDocuments}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Clear ({selectedDocumentIds.length})
                </button>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-foreground
                placeholder-muted-foreground outline-none transition-all border"
              style={{
                background: 'rgba(17,24,39,0.8)',
                borderColor: search ? 'rgba(0,229,255,0.3)' : '#1E293B',
              }}
            />
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scrollbar-thin">

          {/* Processing indicator */}
          {processingTasks.length > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-sys-cyan/30"
              style={{ background: 'rgba(0,229,255,0.05)' }}
            >
              <Loader2 className="w-4 h-4 text-sys-cyan animate-spin shrink-0" />
              <p className="text-sm text-sys-cyan font-medium">
                {processingTasks.length} document{processingTasks.length > 1 ? 's' : ''} processing…
              </p>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && processingTasks.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1E293B' }}
              >
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {search ? 'No matching documents' : 'Knowledge base is empty'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? 'Try a different search term' : 'Upload PDFs or add YouTube videos to get started'}
                </p>
              </div>
            </div>
          )}

          {/* PDF section */}
          {pdfs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-foreground">PDFs</h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded font-mono text-red-400"
                  style={{ background: 'rgba(239,68,68,0.1)' }}
                >
                  {pdfs.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {pdfs.map(doc => (
                  <PdfCard
                    key={doc.id}
                    doc={doc}
                    isSelected={selectedDocumentIds.includes(doc.id)}
                    onToggle={() => toggleSelectedDocument(doc.id)}
                    onDelete={() => deleteDocument(doc.id)}
                    onOpen={() => setPdfViewerDoc(doc)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* YouTube section */}
          {youtubes.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-semibold text-foreground">YouTube</h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded font-mono text-red-500"
                  style={{ background: 'rgba(239,68,68,0.1)' }}
                >
                  {youtubes.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {youtubes.map(doc => (
                  <YoutubeCard
                    key={doc.id}
                    doc={doc}
                    isSelected={selectedDocumentIds.includes(doc.id)}
                    onToggle={() => toggleSelectedDocument(doc.id)}
                    onDelete={() => deleteDocument(doc.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Other files section */}
          {others.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <File className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-foreground">Other Files</h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded font-mono text-zinc-400"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {others.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {others.map(doc => (
                  <GenericCard
                    key={doc.id}
                    doc={doc}
                    isSelected={selectedDocumentIds.includes(doc.id)}
                    onToggle={() => toggleSelectedDocument(doc.id)}
                    onDelete={() => deleteDocument(doc.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Footer status bar ────────────────────────────────────────────── */}
        <div
          className="border-t border-sys-border px-8 py-3 shrink-0 flex items-center justify-between"
          style={{ background: 'rgba(15,23,42,0.9)' }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sys-success animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-mono">KNOWLEDGE BASE · VAATHI OS</span>
          </div>
          {selectedDocumentIds.length > 0 && (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded font-mono text-sys-cyan"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}
            >
              {selectedDocumentIds.length} SELECTED — ACTIVE FILTER
            </span>
          )}
        </div>
      </div>

      {/* ── PDF full viewer ───────────────────────────────────────────────────── */}
      {pdfViewerDoc && (
        <PdfViewer
          url={pdfFileUrl}
          filename={pdfViewerDoc.filename || `Document #${pdfViewerDoc.id}`}
          onClose={() => setPdfViewerDoc(null)}
        />
      )}
    </>
  );
});

KnowledgeBasePage.displayName = 'KnowledgeBasePage';
