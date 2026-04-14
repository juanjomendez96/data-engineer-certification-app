'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';

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
        <h2 className="text-slate-100 font-semibold text-lg">
          Question Review ({questions.length} questions)
        </h2>
        <button
          onClick={toggleAll}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
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
            <div key={q.id} className="rounded-lg border border-slate-700 overflow-hidden">
              <button
                onClick={() => toggle(q.id)}
                className="flex items-center gap-3 w-full px-4 py-3 bg-slate-800 hover:bg-slate-750 text-left transition-colors"
              >
                <span className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  correct ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                )}>
                  {correct ? '✓' : '✗'}
                </span>
                <span className="text-slate-400 text-xs font-mono w-8">Q{i + 1}</span>
                <span className="text-slate-200 text-sm truncate flex-1">{q.text}</span>
                <span className="text-slate-500 text-xs ml-2">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-3 bg-slate-900 border-t border-slate-700 flex flex-col gap-3">
                  <p className="text-slate-200 text-sm leading-relaxed">{q.text}</p>

                  {highlightedHtmlMap[q.id] && (
                    <div
                      className="rounded-md overflow-x-auto text-sm border border-slate-700"
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
                            isCorrect ? 'bg-green-900/40 border border-green-700' :
                            isUser && !isCorrect ? 'bg-red-900/40 border border-red-700' :
                            'bg-slate-800 border border-slate-700'
                          )}
                        >
                          <span className={cn(
                            'font-bold w-5 flex-shrink-0',
                            isCorrect ? 'text-green-400' : isUser ? 'text-red-400' : 'text-slate-500'
                          )}>
                            {LABELS[oi]}.
                          </span>
                          <span className={cn(
                            isCorrect ? 'text-green-300' : isUser && !isCorrect ? 'text-red-300' : 'text-slate-400'
                          )}>
                            {opt}
                          </span>
                          {isCorrect && <span className="ml-auto text-green-400 text-xs font-semibold">✓ Correct</span>}
                          {isUser && !isCorrect && <span className="ml-auto text-red-400 text-xs font-semibold">✗ Your answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-1 p-3 rounded bg-slate-800 border border-slate-600">
                    <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Explanation</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{q.explanation}</p>
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
