import { codeToHtml } from 'shiki';
import type { Language } from '@/lib/types';

interface CodeBlockProps {
  snippet: string;
  language: Language;
}

export async function CodeBlock({ snippet, language }: CodeBlockProps) {
  const html = await codeToHtml(snippet, {
    lang: language,
    theme: 'github-dark',
  });

  return (
    <div
      className="rounded-md overflow-x-auto text-sm my-4 border border-line-subtle"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
