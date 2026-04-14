'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';
import { computeRemaining } from '@/lib/timer';
import { ResumeDialog } from '@/components/ResumeDialog';
import { DOMAIN_CONFIG } from '@/lib/domainConfig';
import type { HistoryEntry } from '@/lib/types';

type ResumeState = 'none' | 'resumable' | 'expired-pending';

export default function LandingPage() {
  const session = useExamStore(s => s.session);
  const startExam = useExamStore(s => s.startExam);
  const abandonExam = useExamStore(s => s.abandonExam);
  const submitExam = useExamStore(s => s.submitExam);
  const [resumeState, setResumeState] = useState<ResumeState>('none');
  const [remainingAtLoad, setRemainingAtLoad] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      setResumeState('none');
    } else {
      const remaining = computeRemaining(session.startTimestamp);
      if (remaining > 0) {
        setRemainingAtLoad(remaining);
        setResumeState('resumable');
      } else {
        setResumeState('expired-pending');
        submitExam(true);
        router.push('/results?expired=true');
      }
    }
    const raw = localStorage.getItem('examHistory') ?? '[]';
    setHistory(JSON.parse(raw));
  }, []);

  const handleStart = () => {
    startExam();
    router.push('/exam');
  };

  const handleResume = () => {
    router.push('/exam');
  };

  const handleStartNew = () => {
    abandonExam();
    startExam();
    router.push('/exam');
  };

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  };

  return (
    <>
      {resumeState === 'resumable' && (
        <ResumeDialog
          remainingSeconds={remainingAtLoad}
          onResume={handleResume}
          onStartNew={handleStartNew}
        />
      )}

      <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col gap-10">
        {/* Header */}
        <div className="text-center flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 mx-auto px-3 py-1 rounded-full bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-semibold uppercase tracking-wider">
            Practice Exam Simulator
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100 leading-tight">
            Databricks Certified<br />
            <span className="text-[#FF3621]">Data Engineer Associate</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            45 questions · 90 minutes · 70% to pass · Weighted domain scoring
          </p>
        </div>

        {/* Exam info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(DOMAIN_CONFIG).map(([key, meta]) => (
            <div key={key} className="rounded-lg border border-slate-700 bg-[#2D3748] px-4 py-3">
              <p className="text-xs text-slate-400 mb-1">{Math.round(meta.weight * 100)}% weight</p>
              <p className="text-sm font-medium text-slate-200 leading-snug">{meta.displayName}</p>
              <p className="text-xs text-slate-500 mt-1">{meta.count} questions</p>
            </div>
          ))}
        </div>

        {/* Start button */}
        <div className="text-center">
          <button
            onClick={handleStart}
            className="px-10 py-4 rounded-xl bg-[#FF3621] hover:bg-red-600 text-white font-bold text-lg shadow-lg shadow-red-900/30 transition-colors"
          >
            Start Exam
          </button>
          <p className="text-slate-500 text-xs mt-3">
            Timer starts immediately. Progress is saved in your browser.
          </p>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-slate-300 font-semibold mb-3">Recent Attempts</h2>
            <div className="flex flex-col gap-2">
              {history.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-700 bg-[#2D3748] px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${entry.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.passed ? 'PASS' : 'FAIL'}
                    </span>
                    <span className="text-slate-200 font-mono tabular-nums">{entry.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="text-slate-500 text-xs">
                    {formatDuration(entry.durationSeconds)} · {new Date(entry.answeredAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
