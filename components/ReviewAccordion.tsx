'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';
import { InlineMarkdown } from './InlineMarkdown';
import { ExplanationMarkdown } from './ExplanationMarkdown';

interface ReviewAccordionProps {
  questions: Question[];
  answers: Record<string, number>;
  highlightedHtmlMap: Record<string, string>;
}

const LABELS = ['A', 'B', 'C', 'D'];

export function ReviewAccordion({ questions, answers, highlightedHtmlMap }: ReviewAccordionProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAll = () => {
    if (allExpanded) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(questions.map(q => q.id)));
    }
    setAllExpanded(!allExpanded);
  };

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-ink-primary font-semibold text-lg">
          Question Review ({questions.length} questions)
        </h2>
        <button
          onClick={toggleAll}
          className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {questions.map((q, i) => {
          const userAnswer = answers[q.id];
          const correct = userAnswer === q.answer;
          const isOpen = expanded.has(q.id);

          return (
            <div key={q.id} className="rounded-lg border border-line-subtle overflow-hidden">
              <button
                onClick={() => toggle(q.id)}
                className="flex items-center gap-3 w-full px-4 py-3 bg-canvas-elevated hover:bg-canvas-hover text-left transition-colors"
              >
                <span className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  correct ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                )}>
                  {correct ? '✓' : '✗'}
                </span>
                <span className="text-ink-muted text-xs font-mono w-8">Q{i + 1}</span>
                <span className="text-ink-primary text-sm truncate flex-1"><InlineMarkdown text={q.text} /></span>
                <span className="text-ink-subtle text-xs ml-2">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-3 bg-canvas-sunken border-t border-line-subtle flex flex-col gap-3">
                  <p className="text-ink-primary text-sm leading-relaxed"><InlineMarkdown text={q.text} /></p>

                  {highlightedHtmlMap[q.id] && (
                    <div
                      className="rounded-md overflow-x-auto text-sm border border-line-subtle"
                      dangerouslySetInnerHTML={{ __html: highlightedHtmlMap[q.id] }}
                    />
                  )}

                  <div className="flex flex-col gap-1.5">
                    {q.options.map((opt, oi) => {
                      const isUser = userAnswer === oi;
                      const isCorrect = q.answer === oi;
                      return (
                        <div
                          key={oi}
                          className={cn(
                            'flex items-start gap-2 rounded px-3 py-2 text-sm',
                            isCorrect ? 'bg-green-100 border border-green-500 dark:bg-green-900/40 dark:border-green-700' :
                            isUser && !isCorrect ? 'bg-red-100 border border-red-500 dark:bg-red-900/40 dark:border-red-700' :
                            'bg-canvas-elevated border border-line-subtle'
                          )}
                        >
                          <span className={cn(
                            'font-bold w-5 flex-shrink-0',
                            isCorrect ? 'text-green-600 dark:text-green-400' : isUser ? 'text-red-600 dark:text-red-400' : 'text-ink-subtle'
                          )}>
                            {LABELS[oi]}.
                          </span>
                          <span className={cn(
                            'min-w-0 flex-1',
                            isCorrect ? 'text-green-700 dark:text-green-300' : isUser && !isCorrect ? 'text-red-700 dark:text-red-300' : 'text-ink-muted'
                          )}>
                            <InlineMarkdown text={opt} />
                          </span>
                          {isCorrect && <span className="ml-auto text-green-600 dark:text-green-400 text-xs font-semibold">✓ Correct</span>}
                          {isUser && !isCorrect && <span className="ml-auto text-red-600 dark:text-red-400 text-xs font-semibold">✗ Your answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 rounded-lg bg-canvas-base border border-line-subtle overflow-hidden">
                    <div className="px-3 py-2 bg-canvas-elevated border-b border-line-subtle flex items-center gap-2">
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide">Explanation</span>
                    </div>
                    <div className="px-4 py-3">
                      <ExplanationMarkdown text={q.explanation} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
