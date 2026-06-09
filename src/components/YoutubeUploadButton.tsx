import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Loader2, X, Youtube, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useRagContext } from '../context/RagContext';
import { motion, AnimatePresence } from 'framer-motion';

export const YoutubeUploadButton: React.FC = () => {
  const { uploadYoutubeVideo, isLoading } = useRagContext();
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (showModal && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showModal]);

  const isValidYoutubeUrl = (inputUrl: string): boolean => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/[a-zA-Z0-9_-]{11}/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/,
      /^[a-zA-Z0-9_-]{11}$/,
    ];
    return patterns.some(pattern => pattern.test(inputUrl.trim()));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('Please enter a YouTube URL or video ID');
      return;
    }

    if (!isValidYoutubeUrl(trimmedUrl)) {
      setError('Invalid YouTube URL format. Use: youtube.com/watch?v=... or youtu.be/...');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await uploadYoutubeVideo(trimmedUrl);
      if (result) {
        setUrl('');
        setShowModal(false);
        // Show success message or handle accordingly
      } else {
        setError('Failed to process YouTube video. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url, uploadYoutubeVideo]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setUrl('');
    setError('');
  }, []);

  const modalContent = (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 1
            }}
            className="relative w-full max-w-lg bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-premium-dark overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between p-6 border-b border-border/50">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-transparent opacity-50" />
              <h2 className="text-xl font-bold flex items-center gap-3 relative z-10 text-foreground">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 shadow-inner">
                  <Youtube className="w-5 h-5 text-red-500 drop-shadow-sm" />
                </div>
                Add YouTube Video
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted/80 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground relative z-10 group"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 flex flex-col relative z-10">
              <div className="space-y-3">
                <label htmlFor="youtube-url" className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  YouTube URL or Video ID
                </label>
                <div className="relative group">
                  <input
                    ref={inputRef}
                    id="youtube-url"
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g., https://youtu.be/dQw4w9WgXcQ"
                    className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-border/80 bg-background/50 
                      text-foreground placeholder-muted-foreground/60 text-base shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 focus:bg-background
                      transition-all duration-300"
                    disabled={loading}
                    autoComplete="off"
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => {
                        setUrl('');
                        inputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 text-sm text-red-600 dark:text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info Section */}
              <div className="bg-muted/30 border border-border/50 p-5 rounded-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 rounded-l-xl" />
                <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
                  Supported formats
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                    <span className="font-mono text-xs">youtube.com/watch?v=<span className="text-foreground">ID</span></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                    <span className="font-mono text-xs">youtu.be/<span className="text-foreground">ID</span></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                    <span className="font-mono text-xs text-foreground">11-character Video ID</span>
                  </li>
                </ul>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-5 py-3 rounded-xl border border-border/80 bg-background hover:bg-muted/80 hover:border-border
                    transition-all duration-200 text-sm font-semibold text-foreground
                    disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="flex-1 px-5 py-3 rounded-xl bg-red-600 text-white
                    hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5
                    active:scale-[0.98] active:translate-y-0
                    transition-all duration-200 text-sm font-semibold
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none
                    flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Youtube className="w-4 h-4" />
                      <span>Add Video</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Button */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 relative group
          ${isLoading
            ? 'text-muted-foreground/50 cursor-not-allowed bg-muted/50'
            : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
          }`}
        aria-label="Add YouTube video"
        title="Add YouTube video"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
        )}
      </button>

      {/* Modal via createPortal to escape parent's transform/filter context */}
      {typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent}
    </>
  );
};
