// components/PdfViewer.tsx — Full PDF viewer modal (Claude-style)
import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Download, Maximize2, Minimize2,
} from 'lucide-react';

// Use the bundled PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Props {
  url: string;
  filename: string;
  onClose: () => void;
}

export const PdfViewer: React.FC<Props> = ({ url, filename, onClose }) => {
  const [numPages, setNumPages]   = useState<number>(0);
  const [page, setPage]           = useState(1);
  const [scale, setScale]         = useState(1.2);
  const [fullscreen, setFullscreen] = useState(false);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const prev = () => setPage(p => Math.max(1, p - 1));
  const next = () => setPage(p => Math.min(numPages, p + 1));
  const zoomIn  = () => setScale(s => Math.min(2.5, s + 0.2));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.2));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(16px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`flex flex-col rounded-2xl border border-sys-border overflow-hidden transition-all duration-300 ${
          fullscreen ? 'fixed inset-4' : 'w-full max-w-4xl max-h-[92vh]'
        }`}
        style={{
          background: 'rgba(15,23,42,0.97)',
          boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,229,255,0.08)',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-sys-border shrink-0"
          style={{ background: 'rgba(17,24,39,0.9)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{filename}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {numPages > 0 ? `${numPages} pages` : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={url}
              download={filename}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sys-cyan hover:bg-sys-cyan/8 transition-colors"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={() => setFullscreen(f => !f)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sys-cyan hover:bg-sys-cyan/8 transition-colors"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-2 border-b border-sys-border/50 shrink-0"
          style={{ background: 'rgba(15,23,42,0.8)' }}
        >
          {/* Page nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={page <= 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-foreground min-w-[80px] text-center">
              Page {page} / {numPages || '…'}
            </span>
            <button
              onClick={next}
              disabled={page >= numPages}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sys-cyan hover:bg-sys-cyan/8 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sys-cyan hover:bg-sys-cyan/8 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── PDF Pages ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-auto flex justify-center p-6 scrollbar-thin">
          <Document
            file={url}
            onLoadSuccess={onLoadSuccess}
            loading={
              <div className="flex flex-col items-center gap-3 py-20">
                <div className="w-10 h-10 rounded-full border-2 border-sys-cyan/30 border-t-sys-cyan animate-spin" />
                <p className="text-sm text-muted-foreground font-mono">Loading PDF…</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center gap-3 py-20 text-center px-8">
                <p className="text-red-400 text-sm font-mono">Failed to load PDF.</p>
                <p className="text-muted-foreground text-xs">
                  The file may not have been saved on disk yet (uploaded before file storage was enabled).
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sys-cyan text-xs underline"
                >
                  Try opening directly
                </a>
              </div>
            }
          >
            <Page
              pageNumber={page}
              scale={scale}
              className="shadow-2xl rounded-lg overflow-hidden"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>

        {/* ── Bottom page strip ────────────────────────────────────────────────── */}
        {numPages > 1 && (
          <div
            className="border-t border-sys-border/50 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-thin shrink-0"
            style={{ background: 'rgba(15,23,42,0.9)' }}
          >
            {Array.from({ length: Math.min(numPages, 20) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`shrink-0 w-8 h-8 rounded text-[10px] font-mono font-bold transition-all ${
                  p === page
                    ? 'text-sys-cyan'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/8'
                }`}
                style={p === page ? { background: 'rgba(0,229,255,0.12)' } : {}}
              >
                {p}
              </button>
            ))}
            {numPages > 20 && (
              <span className="text-[10px] text-muted-foreground font-mono self-center px-2">
                +{numPages - 20} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
