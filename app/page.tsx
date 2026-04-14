'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useExamStore } from '@/store/examStore';
import { computeRemaining } from '@/lib/timer';
import { ResumeDialog } from '@/components/ResumeDialog';
import { DOMAIN_CONFIG } from '@/lib/domainConfig';
import type { HistoryEntry } from '@/lib/types';

type ResumeState = 'none' | 'resumable' | 'expired-pending';

function LandingContent() {
  const session = useExamStore(s => s.session);
  const startExam = useExamStore(s => s.startExam);
  const abandonExam = useExamStore(s => s.abandonExam);
  const submitExam = useExamStore(s => s.submitExam);
  const studentName = useExamStore(s => s.studentName);
  const setStudentName = useExamStore(s => s.setStudentName);

  const [resumeState, setResumeState] = useState<ResumeState>('none');
  const [remainingAtLoad, setRemainingAtLoad] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filterName, setFilterName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [cleared, setCleared] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle ?clear=history from `make clear-history`
    if (searchParams.get('clear') === 'history') {
      localStorage.removeItem('examHistory');
      setHistory([]);
      setCleared(true);
      router.replace('/');
      return;
    }

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
    if (!studentName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    startExam();
    router.push('/exam');
  };

  const handleResume = () => router.push('/exam');

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

  const filteredHistory = filterName.trim()
    ? history.filter(e =>
        e.studentName?.toLowerCase().includes(filterName.trim().toLowerCase())
      )
    : history;

  return (
    <>
      {cleared && (
        <div className="fixed top-4 right-4 z-50 bg-green-800 border border-green-600 text-green-200 text-sm px-4 py-2 rounded-lg shadow-lg">
          ✓ All attempts cleared.
        </div>
      )}
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

        {/* Student name + Start */}
        <div className="rounded-xl border border-slate-700 bg-[#2D3748] p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="student-name" className="text-sm font-medium text-slate-300">
              Your name <span className="text-red-400">*</span>
            </label>
            <input
              id="student-name"
              type="text"
              value={studentName}
              onChange={e => {
                setStudentName(e.target.value);
                if (e.target.value.trim()) setNameError(false);
              }}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="Enter your name to get started"
              className={`w-full rounded-lg px-4 py-2.5 bg-slate-800 text-slate-100 placeholder-slate-500 border text-sm outline-none transition-colors
                ${nameError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500'}`}
            />
            {nameError && (
              <p className="text-red-400 text-xs">Please enter your name before starting.</p>
            )}
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 rounded-lg bg-[#FF3621] hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-red-900/20 transition-colors"
          >
            Start Exam
          </button>
          <p className="text-slate-500 text-xs text-center">
            Timer starts immediately. Progress is saved in your browser.
          </p>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-slate-300 font-semibold">
                Recent Attempts
                {filterName && (
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    — {filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">🔍</span>
                <input
                  type="text"
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                  placeholder="Filter by name…"
                  className="rounded-lg border border-slate-600 bg-slate-800 text-slate-200 placeholder-slate-500 text-xs px-3 py-1.5 w-40 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                />
                {filterName && (
                  <button
                    onClick={() => setFilterName('')}
                    className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
                    aria-label="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="text-slate-500 text-sm">No attempts found for this student.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredHistory.map((entry, i) => {
                  // Find the original index in the unfiltered history for the review URL
                  const originalIndex = history.indexOf(entry);
                  const hasReviewData = !!entry.questionIds?.length;
                  return (
                    <button
                      key={i}
                      onClick={() => hasReviewData && router.push(`/review?i=${originalIndex}`)}
                      disabled={!hasReviewData}
                      className={`flex items-center justify-between rounded-lg border border-slate-700 bg-[#2D3748] px-4 py-3 text-sm w-full text-left transition-colors
                        ${hasReviewData ? 'hover:border-slate-500 hover:bg-slate-700 cursor-pointer' : 'cursor-default opacity-70'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${entry.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {entry.passed ? 'PASS' : 'FAIL'}
                        </span>
                        <span className="text-slate-200 font-mono tabular-nums">
                          {entry.percentage.toFixed(1)}%
                        </span>
                        {entry.studentName && (
                          <span className="text-slate-400 text-xs">{entry.studentName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-xs">
                          {formatDuration(entry.durationSeconds)} · {new Date(entry.answeredAt).toLocaleDateString()}
                        </span>
                        {hasReviewData && (
                          <span className="text-slate-500 text-xs">→</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  );
}
