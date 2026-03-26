import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useRagContext } from '../context/RagContext'; 

export const ChatHeader: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isLoading } = useRagContext();

  const title = 'Vaathi';

  return (
    // The outer div gives the header room to "float" away from the top and sides
    <div className="p-4 z-10 shrink-0 w-full relative">
      <header className="flex items-center justify-between px-4 py-2.5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/50 dark:border-zinc-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-2xl transition-all">
        
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-700 shadow-sm">
            <img 
              src="/images/vaathi.png" 
              alt="Vaathi Logo" 
              className="w-full h-full object-contain p-0.5" 
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {title}
            </h1>
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider -mt-0.5">
              RAG Engine
            </p>
          </div>
        </div>

        {/* Center: Mild Streaming Indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50/50 dark:bg-violet-900/20 border border-violet-100/50 dark:border-violet-800/50 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
              <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">Thinking</span>
            </div>
          )}
        </div>

        {/* Right: Theme Toggle */}
        <div className="flex items-center">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-all"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </header>
    </div>
  );
};