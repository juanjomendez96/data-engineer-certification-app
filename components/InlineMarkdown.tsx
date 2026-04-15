import { Fragment } from 'react';

/**
 * Renders a string with inline markdown: **bold** and `inline code`.
 */
export function InlineMarkdown({ text }: { text: string }) {
  // Split on **bold** and `code` spans
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1 py-0.5 rounded text-xs font-mono bg-slate-700 text-slate-200"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
