import React, { memo } from 'react';

interface Props {
  content: string;
  className?: string;
}

// Lightweight markdown renderer — no external deps
const processInline = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  // Bold, italic, code, links
  const re = /(\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));

    if (m[2] || m[3]) {
      parts.push(<strong key={key++} className="font-semibold">{m[2] || m[3]}</strong>);
    } else if (m[4] || m[5]) {
      parts.push(<em key={key++}>{m[4] || m[5]}</em>);
    } else if (m[6]) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded-md text-[0.85em] font-mono bg-zinc-100 dark:bg-zinc-800 text-pink-600 dark:text-pink-400">
          {m[6]}
        </code>
      );
    } else if (m[7] && m[8]) {
      parts.push(
        <a key={key++} href={m[8]} target="_blank" rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 underline underline-offset-2">
          {m[7]}
        </a>
      );
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

export const MarkdownRenderer: React.FC<Props> = memo(({ content, className = '' }) => {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <div key={key++} className="my-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
          {lang && (
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{lang}</span>
            </div>
          )}
          <pre className="overflow-x-auto p-4 bg-zinc-50 dark:bg-zinc-900 text-sm leading-relaxed">
            <code className="font-mono text-zinc-800 dark:text-zinc-200">{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      nodes.push(<h1 key={key++} className="text-2xl font-bold mt-5 mb-2 text-zinc-900 dark:text-zinc-50">{processInline(h1[1])}</h1>);
      i++; continue;
    }
    if (h2) {
      nodes.push(<h2 key={key++} className="text-xl font-semibold mt-4 mb-2 text-zinc-900 dark:text-zinc-50">{processInline(h2[1])}</h2>);
      i++; continue;
    }
    if (h3) {
      nodes.push(<h3 key={key++} className="text-base font-semibold mt-3 mb-1 text-zinc-800 dark:text-zinc-100">{processInline(h3[1])}</h3>);
      i++; continue;
    }

    // Horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="my-4 border-zinc-200 dark:border-zinc-700" />);
      i++; continue;
    }

    // Unordered list
    if (/^[\*\-\+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\*\-\+] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={key++} className="my-2 ml-4 space-y-1 list-none">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-zinc-700 dark:text-zinc-300">
              <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
              <span>{processInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      nodes.push(
        <ol key={key++} className="my-2 ml-4 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-zinc-700 dark:text-zinc-300">
              <span className="shrink-0 text-zinc-400 dark:text-zinc-500 text-sm font-mono tabular-nums min-w-[1.2rem]">{idx + 1}.</span>
              <span>{processInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push(
        <blockquote key={key++} className="my-2 pl-3 border-l-2 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 italic">
          {processInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      nodes.push(<div key={key++} className="h-2" />);
      i++; continue;
    }

    // Regular paragraph
    nodes.push(
      <p key={key++} className="text-zinc-700 dark:text-zinc-300 leading-7">
        {processInline(line)}
      </p>
    );
    i++;
  }

  return (
    <div className={`prose-custom ${className}`}>
      {nodes}
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
