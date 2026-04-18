import { Fragment } from 'react';

/**
 * Renders a string with inline markdown: **bold**, `inline code`, and ```code blocks```.
 */
export function InlineMarkdown({ text }: { text: string }) {
  // Handle fenced code blocks (```lang?\ncode\n```)
  const fencedMatch = text.match(/^```(\w*)\n([\s\S]*?)```$/);
  if (fencedMatch) {
    return (
      <pre className="rounded-md bg-canvas-sunken border border-line-subtle px-3 py-2 text-xs font-mono text-ink-primary overflow-x-auto whitespace-pre">
        <code>{fencedMatch[2]}</code>
      </pre>
    );
  }

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
              className="px-1 py-0.5 rounded text-xs font-mono bg-canvas-hover text-ink-primary"
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
