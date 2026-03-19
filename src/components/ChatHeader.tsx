import React from 'react';
import { Menu, Sun, Moon, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';

interface Props {
  onToggleSidebar: () => void;
}

export const ChatHeader: React.FC<Props> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { activeConversation, state } = useChat();
  const isStreaming = state.streamStatus === 'streaming';

  const title = activeConversation?.title ?? 'RAG Assistant';

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-xs">
            {title}
          </h1>
        </div>
      </div>

      {/* Center: streaming indicator */}
      <div className="flex items-center gap-2">
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-xs text-violet-500 dark:text-violet-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Generating…
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>
      </div>
    </header>
  );
};
