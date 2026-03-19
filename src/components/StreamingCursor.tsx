import React from 'react';

export const StreamingCursor: React.FC = () => (
  <span
    className="inline-block w-[2px] h-[1.1em] bg-current ml-[1px] align-text-bottom animate-blink"
    aria-hidden="true"
  />
);
