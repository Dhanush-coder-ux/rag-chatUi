// components/ChatHeader.tsx — VAATHI OS Command Bar
import React from 'react';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { useRagContext } from '../context/RagContext';

interface ChatHeaderProps {
  sidebarOpen:     boolean;
  onToggleSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { isLoading } = useRagContext();

  return (
    <header className="shrink-0 w-full relative z-10" style={{
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(17,17,17,0.8)',
      boxShadow: '0 1px 0 rgba(118,185,0,0.06), 0 4px 24px rgba(0,0,0,0.4)',
    }}>
      {/* Active processing glow bar */}
      {isLoading && (
        <div className="absolute bottom-0 inset-x-0 h-px overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-sys-green to-transparent
            animate-[shimmer_1.4s_ease_infinite]"
            style={{ backgroundSize: '200% 100%' }} />
        </div>
      )}

      <div className="flex items-center gap-4 px-4 py-3">
        {/* ── Left: Sidebar toggle + Brand ─────────────────────────────────── */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
              text-muted-foreground hover:text-sys-green hover:bg-sys-green/8
              transition-all duration-200 border border-transparent hover:border-sys-green/20"
          >
            {sidebarOpen
              ? <PanelLeftClose className="w-4 h-4" />
              : <PanelLeft className="w-4 h-4" />
            }
          </button>

          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>
                VAATHI SYSTEM
              </span>
              {isLoading && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-sys-green/30 animate-in fade-in"
                  style={{ background: 'rgba(118,185,0,0.08)' }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sys-green/75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sys-green" />
                  </span>
                  <span className="text-[10px] text-sys-green font-mono font-semibold">PROCESSING</span>
                </div>
              )}
            </div>
            <span className="system-label mt-0.5" style={{ fontSize: '9px' }}>Research Assistant · v2.0</span>
          </div>
        </div>
      </div>
    </header>
  );
};