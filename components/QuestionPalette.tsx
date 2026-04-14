'use client';

import { cn } from '@/lib/utils';

interface PaletteSlot {
  index: number;
  answered: boolean;
  flagged: boolean;
  current: boolean;
}

interface QuestionPaletteProps {
  slots: PaletteSlot[];
  onJump: (index: number) => void;
  onSubmit: () => void;
}

export function QuestionPalette({ slots, onJump, onSubmit }: QuestionPaletteProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-5 gap-1.5">
        {slots.map((slot) => (
          <button
            key={slot.index}
            onClick={() => onJump(slot.index)}
            className={cn(
              'w-9 h-9 rounded text-xs font-semibold transition-colors',
              slot.current && 'ring-2 ring-white',
              slot.flagged
                ? 'bg-yellow-500 text-black'
                : slot.answered
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-400'
            )}
          >
            {slot.index + 1}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-400 mt-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-slate-700 inline-block" /> Unanswered
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" /> Answered
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" /> Flagged
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="mt-2 w-full rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 transition-colors"
      >
        Submit Exam
      </button>
    </div>
  );
}
