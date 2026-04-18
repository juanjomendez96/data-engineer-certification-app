'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const components: Components = {
  p: ({ children }) => (
    <p className="text-ink-secondary text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ink-primary">{children}</strong>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <pre className="my-2 rounded-md bg-canvas-sunken border border-line-subtle p-3 overflow-x-auto">
          <code className="text-xs font-mono text-ink-primary whitespace-pre">{children}</code>
        </pre>
      );
    }
    return (
      <code className="px-1 py-0.5 rounded text-xs font-mono bg-canvas-hover text-sky-700 dark:text-sky-300">
        {children}
      </code>
    );
  },
  ul: ({ children }) => (
    <ul className="my-2 ml-4 flex flex-col gap-1 list-none">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="text-ink-secondary text-sm leading-relaxed flex gap-2">
      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-ink-subtle" />
      <span>{children}</span>
    </li>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-line-subtle">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-canvas-elevated">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-line-subtle">{children}</tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="even:bg-canvas-elevated/40 hover:bg-canvas-hover/30 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-ink-primary border-b border-line whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-ink-secondary align-top">{children}</td>
  ),
};

export function ExplanationMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  );
}
