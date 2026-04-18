'use client';

import { formatTime } from '@/lib/timer';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  remaining: number;
}

export function TimerDisplay({ remaining }: TimerDisplayProps) {
  const isWarning = remaining < 300; // < 5 minutes
  const isCritical = remaining < 60;

  return (
    <span
      className={cn(
        'font-mono font-bold text-lg tabular-nums',
        isCritical ? 'text-red-400 animate-pulse' : isWarning ? 'text-yellow-400' : 'text-ink-primary'
      )}
    >
      {formatTime(remaining)}
    </span>
  );
}
