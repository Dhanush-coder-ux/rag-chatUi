import React from 'react';
import { Sun, Moon, PanelLeft, PanelLeftClose, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useRagContext } from '../context/RagContext';

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { isLoading } = useRagContext();

  return (
    <div className="px-4 pt-4 pb-2 z-10 shrink-0 w-full relative">
      <header
        className="
          flex items-center justify-between px-3 py-2.5
          bg-background/80
          backdrop-blur-2xl
          border border-border/40
          shadow-premium dark:shadow-premium-dark
          rounded-2xl transition-all duration-300
        "
      >
        {/* ── Left: Sidebar toggle + brand (when sidebar is closed) ──────── */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Toggle button — always lives here, no overlap risk */}
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="
              shrink-0 w-8 h-8 flex items-center justify-center rounded-xl
              text-muted-foreground
              hover:text-foreground
              transition-all duration-200 hover:scale-105
            "
          >
            {sidebarOpen
              ? <PanelLeftClose className="w-4 h-4" />
              : <PanelLeft className="w-4 h-4" />
            }
          </button>

          {/* Brand — only shown when sidebar is closed */}
          {!sidebarOpen && (
            <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200">
              <div
                className="
                  w-7 h-7 rounded-lg overflow-hidden
                  border border-violet-400/20 shadow-md shadow-violet-500/20
                  flex items-center justify-center
                "
              >
                <img
                  src="/images/vaathi.png"
                  alt="Vaathi"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-foreground tracking-tight">
                  Vaathi
                </span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
                  RAG Engine
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Center: Thinking indicator ─────────────────────────────────── */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
          {isLoading ? (
            <div
              className="
                flex items-center gap-2 px-3 py-1 rounded-full
                bg-violet-500/10 border border-violet-500/20
                backdrop-blur-sm
                animate-in fade-in duration-300
              "
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              <span className="text-xs text-primary font-medium">
                Thinking…
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground select-none">
              <Sparkles className="w-3 h-3" />
              <span className="text-xs font-medium">Ask anything</span>
            </div>
          )}
        </div>

        {/* ── Right: Theme toggle ────────────────────────────────────────── */}
        <div className="flex items-center">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="
              w-8 h-8 flex items-center justify-center rounded-xl
              text-muted-foreground
              hover:text-foreground
              transition-all duration-200 hover:scale-105
            "
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>
        </div>
      </header>
    </div>
  );
};