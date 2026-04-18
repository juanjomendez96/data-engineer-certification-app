'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReviewAccordion } from '@/components/ReviewAccordion';
import { DomainBar } from '@/components/DomainBar';
import { ScoreGauge } from '@/components/ScoreGauge';
import { DOMAIN_CONFIG } from '@/lib/domainConfig';
import type { HistoryEntry, Question, DomainKey } from '@/lib/types';
import questionsRaw from '@/data/questions.json';
import { codeToHtml } from 'shiki';

const bank = questionsRaw as unknown as Question[];
const bankMap = new Map(bank.map(q => [q.id, q]));

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const index = Number(searchParams.get('i') ?? '0');

  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [highlightedHtmlMap, setHighlightedHtmlMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = localStorage.getItem('examHistory') ?? '[]';
    const history: HistoryEntry[] = JSON.parse(raw);
    const found = history[index];
    if (!found || !found.questionIds) {
      setNotFound(true);
      return;
    }
    setEntry(found);

    // Pre-render Shiki highlights
    const questions = found.questionIds.map(id => bankMap.get(id)!).filter(Boolean);
    Promise.all(
      questions
        .filter(q => q.code)
        .map(async q => {
          const html = await codeToHtml(q.code!.snippet, {
            lang: q.code!.language,
            theme: 'github-dark',
          });
          return [q.id, html] as [string, string];
        })
    ).then(entries => setHighlightedHtmlMap(Object.fromEntries(entries)));
  }, [index]);

  if (notFound) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center flex flex-col gap-4">
        <p className="text-ink-muted">
          This attempt could not be loaded. It may have been recorded before full review data was saved.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mx-auto px-6 py-2 rounded-lg bg-canvas-hover hover:bg-canvas-elevated text-ink-primary text-sm transition-colors"
        >
          ← Back to dashboard
        </button>
      </main>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }

  const questions = entry.questionIds.map(id => bankMap.get(id)!).filter(Boolean);

  // Compute per-domain results from the history entry
  const domainResults = Object.entries(DOMAIN_CONFIG).map(([key, meta]) => {
    const domainQs = questions.filter(q => q.domain === key);
    const correct = domainQs.filter(q => entry.answers[q.id] === q.answer).length;
    return {
      key: key as DomainKey,
      displayName: meta.displayName,
      weight: meta.weight,
      correct,
      total: domainQs.length,
      percentage: domainQs.length > 0 ? (correct / domainQs.length) * 100 : 0,
    };
  });

  const totalCorrect = domainResults.reduce((s, d) => s + d.correct, 0);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Back */}
      <button
        onClick={() => router.push('/')}
        className="self-start flex items-center gap-2 text-ink-muted hover:text-ink-primary text-sm transition-colors"
      >
        ← Back to dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-ink-primary">Attempt Review</h1>
        <p className="text-ink-muted text-sm">
          {entry.studentName} · {new Date(entry.answeredAt).toLocaleString()}
        </p>
      </div>

      {/* Score */}
      <div className="rounded-xl border border-line-subtle bg-canvas-surface p-6 flex flex-col sm:flex-row gap-6 items-center">
        <ScoreGauge percentage={entry.percentage} passed={entry.passed} />
        <div className="flex flex-col gap-2 text-sm">
          <div className={`text-2xl font-bold ${entry.passed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {entry.passed ? '✓ PASS' : '✗ FAIL'}
          </div>
          <div className="text-ink-secondary">
            Score: <span className="font-mono font-semibold text-ink-primary">{entry.percentage.toFixed(1)}%</span>
          </div>
          <div className="text-ink-muted">Passing threshold: <span className="font-mono">70.0%</span></div>
          <div className="text-ink-muted">
            Answered: <span className="text-ink-primary">{totalCorrect}/{questions.length} correct</span>
          </div>
          <div className="text-ink-muted">
            Duration: <span className="text-ink-primary">{formatDuration(entry.durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Domain breakdown */}
      <div className="rounded-xl border border-line-subtle bg-canvas-surface p-6 flex flex-col gap-4">
        <h2 className="text-ink-primary font-semibold text-lg">Domain Breakdown</h2>
        {domainResults.map(d => (
          <DomainBar
            key={d.key}
            displayName={d.displayName}
            weight={d.weight}
            percentage={d.percentage}
            correct={d.correct}
            total={d.total}
          />
        ))}
      </div>

      {/* Full question review */}
      <div className="rounded-xl border border-line-subtle bg-canvas-surface p-6">
        <ReviewAccordion
          questions={questions}
          answers={entry.answers}
          highlightedHtmlMap={highlightedHtmlMap}
        />
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-ink-muted">
        Loading…
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
