'use client';

import { cn } from '@/lib/utils';
import { InlineMarkdown } from './InlineMarkdown';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  text: string;
  highlightedHtml?: string;
  options: [string, string, string, string];
  selectedAnswer: number | undefined;
  onSelect: (index: number) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function QuestionCard({
  questionNumber,
  totalQuestions,
  text,
  highlightedHtml,
  options,
  selectedAnswer,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
        Question {questionNumber} of {totalQuestions}
      </p>
      <p className="text-slate-100 text-base leading-relaxed"><InlineMarkdown text={text} /></p>

      {highlightedHtml && (
        <div
          className="rounded-md overflow-x-auto text-sm border border-slate-700 my-2"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      )}

      <div className="flex flex-col gap-3 mt-2">
        {options.map((option, i) => {
          const isSelected = selectedAnswer === i;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={cn(
                'flex items-start gap-3 w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                isSelected
                  ? 'bg-slate-700 border-red-500 text-white ring-2 ring-red-500'
                  : 'bg-slate-800 border-slate-600 text-slate-200 hover:border-slate-400'
              )}
            >
              <span className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold',
                isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-slate-500 text-slate-400'
              )}>
                {OPTION_LABELS[i]}
              </span>
              <span className="leading-relaxed"><InlineMarkdown text={option} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
