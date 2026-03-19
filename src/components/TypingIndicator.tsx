import React from 'react';

export const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 px-1 py-2" aria-label="Assistant is typing">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
        style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }}
      />
    ))}
  </div>
);
