'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';
import { computeRemaining } from '@/lib/timer';
import { TimerDisplay } from '@/components/TimerDisplay';
import { QuestionCard } from '@/components/QuestionCard';
import { QuestionPalette } from '@/components/QuestionPalette';
import { toast } from 'sonner';
import questionsRaw from '@/data/questions.json';
import type { Question } from '@/lib/types';
import { codeToHtml } from 'shiki';

const bank = questionsRaw as unknown as Question[];
const bankMap = new Map(bank.map(q => [q.id, q]));

export default function ExamPage() {
  const router = useRouter();
  const session = useExamStore(s => s.session);
  const setAnswer = useExamStore(s => s.setAnswer);
  const flagQuestion = useExamStore(s => s.flagQuestion);
  const setCurrentIndex = useExamStore(s => s.setCurrentIndex);
  const submitExam = useExamStore(s => s.submitExam);
  const abandonExam = useExamStore(s => s.abandonExam);
  const pauseExam = useExamStore(s => s.pauseExam);
  const resumeExam = useExamStore(s => s.resumeExam);

  const [remaining, setRemaining] = useState(0);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [highlightedHtmlMap, setHighlightedHtmlMap] = useState<Record<string, string>>({});
  const warned30 = useRef(false);
  const submitted = useRef(false);

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [session, router]);

  // Pre-render code snippets with Shiki
  useEffect(() => {
    if (!session) return;
    const questions = session.questionIds.map(id => bankMap.get(id)!).filter(Boolean);
    const withCode = questions.filter(q => q.code);

    Promise.all(
      withCode.map(async q => {
        const html = await codeToHtml(q.code!.snippet, {
          lang: q.code!.language,
          theme: 'github-dark',
        });
        return [q.id, html] as [string, string];
      })
    ).then(entries => {
      setHighlightedHtmlMap(Object.fromEntries(entries));
    });
  }, [session?.questionIds.join(',')]);

  // Timer
  useEffect(() => {
    if (!session) return;

    const tick = () => {
      const r = computeRemaining(session.startTimestamp, session.totalPausedMs, session.pausedAt);
      setRemaining(r);

      if (session.pausedAt !== null) return; // frozen — skip warnings & expiry

      if (r <= 30 && !warned30.current) {
        warned30.current = true;
        toast.warning('30 seconds remaining!', { duration: 10000 });
      }

      if (r <= 0 && !submitted.current) {
        submitted.current = true;
        clearInterval(interval);
        submitExam(true);
        router.push('/results?expired=true');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.startTimestamp, session?.pausedAt, session?.totalPausedMs]);

  if (!session) return null;

  const questions = session.questionIds.map(id => bankMap.get(id)!).filter(Boolean);
  const currentQ = questions[session.currentIndex];
  if (!currentQ) return null;

  const handleSubmit = () => {
    const unanswered = questions.filter(q => session.answers[q.id] === undefined).length;
    if (unanswered > 0) {
      const ok = window.confirm(
        `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`
      );
      if (!ok) return;
    }
    submitted.current = true;
    submitExam(false);
    router.push('/results');
  };

  const slots = questions.map((q, i) => ({
    index: i,
    answered: session.answers[q.id] !== undefined,
    flagged: !!session.flags[q.id],
    current: i === session.currentIndex,
  }));

  const answeredCount = Object.keys(session.answers).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-canvas-base border-b border-line-subtle px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 pr-12">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="text-ink-muted hover:text-red-500 dark:hover:text-red-400 text-sm border border-line rounded px-2 py-1 transition-colors"
              title="Exit exam"
            >
              ✕ Exit
            </button>
            <span className="text-ink-muted text-sm hidden sm:block">
              Q{session.currentIndex + 1}/{questions.length}
            </span>
            <span className="text-ink-muted text-sm hidden sm:block">·</span>
            <span className="text-ink-muted text-sm">{answeredCount}/{questions.length} answered</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => session.pausedAt ? resumeExam() : pauseExam()}
              className={`text-sm border rounded px-2 py-1 transition-colors ${
                session.pausedAt
                  ? 'border-green-500 text-green-600 dark:text-green-400 hover:bg-green-500/10'
                  : 'border-line text-ink-muted hover:text-ink-primary'
              }`}
              title={session.pausedAt ? 'Resume exam' : 'Pause exam'}
            >
              {session.pausedAt ? '▶ Resume' : '⏸ Pause'}
            </button>
            <TimerDisplay remaining={remaining} />
          </div>

          <button
            onClick={() => setShowMobilePalette(true)}
            className="md:hidden text-ink-muted hover:text-ink-primary text-sm border border-line rounded px-2 py-1"
          >
            ☰ Questions
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <QuestionCard
            questionNumber={session.currentIndex + 1}
            totalQuestions={questions.length}
            text={currentQ.text}
            highlightedHtml={highlightedHtmlMap[currentQ.id]}
            options={currentQ.options}
            selectedAnswer={session.answers[currentQ.id]}
            onSelect={(idx) => setAnswer(currentQ.id, idx)}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={session.currentIndex === 0}
              onClick={() => setCurrentIndex(session.currentIndex - 1)}
              className="px-4 py-2 rounded-lg border border-line text-ink-secondary hover:bg-canvas-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            >
              ← Prev
            </button>

            <button
              onClick={() => flagQuestion(currentQ.id)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                session.flags[currentQ.id]
                  ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10'
                  : 'border-line text-ink-muted hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400'
              }`}
            >
              ⚑ {session.flags[currentQ.id] ? 'Flagged' : 'Flag'}
            </button>

            {session.currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(session.currentIndex + 1)}
                className="px-4 py-2 rounded-lg border border-line text-ink-secondary hover:bg-canvas-elevated transition-colors text-sm"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="sticky top-24 rounded-xl border border-line-subtle bg-canvas-surface p-4">
            <QuestionPalette
              slots={slots}
              onJump={(i) => setCurrentIndex(i)}
              onSubmit={handleSubmit}
            />
          </div>
        </aside>
      </div>

      {/* Pause overlay */}
      {session.pausedAt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-canvas-surface border border-line rounded-xl shadow-2xl p-10 max-w-sm w-full mx-4 flex flex-col items-center gap-6 text-center">
            <div className="text-4xl">⏸</div>
            <div>
              <h2 className="text-xl font-bold text-ink-primary mb-1">Exam paused</h2>
              <p className="text-ink-muted text-sm">The timer is frozen. Take your time.</p>
            </div>
            <TimerDisplay remaining={remaining} />
            <button
              onClick={resumeExam}
              className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-3 transition-colors"
            >
              ▶ Resume exam
            </button>
          </div>
        </div>
      )}

      {/* Exit confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-canvas-surface border border-line rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-ink-primary mb-2">Exit exam?</h2>
            <p className="text-ink-muted text-sm mb-6">
              Your progress will be lost and this attempt will <span className="font-semibold text-ink-primary">not</span> be saved to history.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { abandonExam(); router.replace('/'); }}
                className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 transition-colors"
              >
                Yes, exit
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full rounded-lg bg-canvas-hover hover:bg-canvas-elevated text-ink-primary font-semibold py-2.5 transition-colors"
              >
                Continue exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile palette drawer */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobilePalette(false)} />
          <div className="relative bg-canvas-surface border-t border-line rounded-t-2xl p-6">
            <h3 className="text-ink-primary font-semibold mb-4">Jump to Question</h3>
            <QuestionPalette
              slots={slots}
              onJump={(i) => { setCurrentIndex(i); setShowMobilePalette(false); }}
              onSubmit={() => { setShowMobilePalette(false); handleSubmit(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
