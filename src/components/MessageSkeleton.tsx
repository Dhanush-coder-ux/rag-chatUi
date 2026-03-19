import React from 'react';

/**
 * Skeleton placeholder shown while an assistant message is loading
 * before the first streaming token arrives.
 */
export const MessageSkeleton: React.FC = () => (
  <div className="flex gap-3 px-4 py-3 animate-slide-up" aria-hidden="true">
    {/* Avatar skeleton */}
    <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-shimmer" />

    {/* Content skeleton */}
    <div className="flex flex-col gap-2 max-w-[70%] w-full">
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-2">
        <div className="h-3 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-shimmer" />
        <div className="h-3 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 animate-shimmer" style={{ animationDelay: '80ms' }} />
        <div className="h-3 w-5/6 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-shimmer" style={{ animationDelay: '160ms' }} />
        <div className="h-3 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-shimmer" style={{ animationDelay: '240ms' }} />
      </div>
    </div>
  </div>
);
