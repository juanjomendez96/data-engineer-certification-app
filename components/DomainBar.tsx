'use client';

import { cn } from '@/lib/utils';

interface DomainBarProps {
  displayName: string;
  weight: number;
  percentage: number;
  correct: number;
  total: number;
}

export function DomainBar({ displayName, weight, percentage, correct, total }: DomainBarProps) {
  const passed = percentage >= 70;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-primary font-medium">
          {displayName}
          <span className="text-ink-muted ml-1 font-normal">({Math.round(weight * 100)}%)</span>
        </span>
        <span className={cn('font-semibold tabular-nums', passed ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400')}>
          {correct}/{total} — {percentage.toFixed(1)}% {passed ? '✓' : '✗'}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-canvas-hover overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', passed ? 'bg-green-500' : 'bg-red-500')}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
        {/* 70% threshold marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-ink-primary opacity-70" style={{ left: '70%' }} />
      </div>
    </div>
  );
}
