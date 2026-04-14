'use client';

import { formatTime } from '@/lib/timer';

interface ResumeDialogProps {
  remainingSeconds: number;
  onResume: () => void;
  onStartNew: () => void;
}

export function ResumeDialog({ remainingSeconds, onResume, onStartNew }: ResumeDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Resume Exam?</h2>
        <p className="text-slate-400 text-sm mb-6">
          You have an exam in progress. You have{' '}
          <span className="text-yellow-400 font-mono font-semibold">{formatTime(remainingSeconds)}</span>{' '}
          remaining.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-3 transition-colors"
          >
            Resume Exam
          </button>
          <button
            onClick={onStartNew}
            className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 transition-colors"
          >
            Start New Exam
          </button>
        </div>
      </div>
    </div>
  );
}
