'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useExamStore } from '@/store/examStore';
import { ScoreGauge } from '@/components/ScoreGauge';
import { DomainBar } from '@/components/DomainBar';
import { ReviewAccordion } from '@/components/ReviewAccordion';
import { DOMAIN_CONFIG } from '@/lib/domainConfig';
import questionsRaw from '@/data/questions.json';
import type { Question } from '@/lib/types';
import { codeToHtml } from 'shiki';

const bank = questionsRaw as unknown as Question[];
const bankMap = new Map(bank.map(q => [q.id, q]));

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === 'true';
  const lastResult = useExamStore(s => s.lastResult);
  const startExam = useExamStore(s => s.startExam);
  const [highlightedHtmlMap, setHighlightedHtmlMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!lastResult) {
      router.replace('/');
      return;
    }

    const questions = lastResult.questionIds.map(id => bankMap.get(id)!).filter(Boolean);
    const withCode = questions.filter(q => q.code);

    Promise.all(
      withCode.map(async q => {
        const html = await codeToHtml(q.code!.snippet, {
          lang: q.code!.language,
          theme: 'github-dark',
        });
        return [q.id, html] as [string, string];
      })
    ).then(entries => setHighlightedHtmlMap(Object.fromEntries(entries)));
  }, [lastResult, router]);

  if (!lastResult) return null;

  const questions = lastResult.questionIds.map(id => bankMap.get(id)!).filter(Boolean);

  const handleStartNew = () => {
    startExam();
    router.push('/exam');
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Expired banner */}
      {expired && (
        <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300 px-4 py-3 text-sm font-medium">
          ⚠ Time expired — exam was auto-submitted
        </div>
      )}

      {/* Score section */}
      <div className="rounded-xl border border-line-subtle bg-canvas-surface p-6 flex flex-col sm:flex-row gap-6 items-center">
        <ScoreGauge percentage={lastResult.percentage} passed={lastResult.passed} />
        <div className="flex flex-col gap-2 text-sm">
          <div className={`text-2xl font-bold ${lastResult.passed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {lastResult.passed ? '✓ PASS' : '✗ FAIL'}
          </div>
          <div className="text-ink-secondary">
            Score: <span className="font-mono font-semibold text-ink-primary">{lastResult.percentage.toFixed(1)}%</span>
          </div>
          <div className="text-ink-muted">Passing threshold: <span className="font-mono">70.0%</span></div>
          <div className="text-ink-muted">
            Answered: <span className="text-ink-primary">{lastResult.totalCorrect}/{lastResult.totalQuestions} correct</span>
          </div>
          <div className="text-ink-muted">
            Duration: <span className="text-ink-primary">{formatDuration(lastResult.durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Domain breakdown */}
      <div className="rounded-xl border border-line-subtle bg-canvas-surface p-6 flex flex-col gap-4">
        <h2 className="text-ink-primary font-semibold text-lg">Domain Breakdown</h2>
        {Object.entries(DOMAIN_CONFIG).map(([key, meta]) => {
          const dr = lastResult.domains[key as keyof typeof lastResult.domains];
          if (!dr) return null;
          return (
            <DomainBar
              key={key}
              displayName={meta.displayName}
              weight={meta.weight}
              percentage={dr.percentage}
              correct={dr.correct}
              total={dr.total}
            />
          );
        })}
      </div>

      {/* Review accordion */}
      <div className="rounded-xl border border-line-subtle bg-canvas-surface p-6">
        <ReviewAccordion
          questions={questions}
          answers={lastResult.answers}
          highlightedHtmlMap={highlightedHtmlMap}
        />
      </div>

      {/* Start new */}
      <div className="text-center">
        <button
          onClick={handleStartNew}
          className="px-8 py-3 rounded-xl bg-[#FF3621] hover:bg-red-600 text-white font-bold transition-colors"
        >
          Start New Exam
        </button>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ink-muted">Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
