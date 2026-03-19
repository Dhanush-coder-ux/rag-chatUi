import { useRef, useEffect, useCallback } from 'react';

/**
 * Provides a ref for the scroll container and a ref for the bottom anchor.
 * Auto-scrolls to bottom when `deps` change, but only if the user hasn't
 * manually scrolled up (within `threshold` px of the bottom).
 */
export const useAutoScroll = <T extends HTMLElement>(
  deps: unknown[],
  threshold = 120
) => {
  const containerRef = useRef<T>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUp.current = distFromBottom > threshold;
  }, [threshold]);

  // Scroll on dependency changes (new tokens, new messages)
  useEffect(() => {
    if (!userScrolledUp.current) {
      scrollToBottom('smooth');
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  // Always snap to bottom when conversation resets
  useEffect(() => {
    userScrolledUp.current = false;
    scrollToBottom('instant');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { containerRef, bottomRef, handleScroll, scrollToBottom };
};
