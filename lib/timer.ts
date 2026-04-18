export const EXAM_DURATION_SECONDS = 5400; // 90 * 60

export function computeRemaining(
  startTimestamp: number,
  totalPausedMs = 0,
  pausedAt: number | null = null
): number {
  // Freeze the clock at pausedAt when paused
  const now = pausedAt ?? Date.now();
  const effectiveElapsed = (now - startTimestamp - totalPausedMs) / 1000;
  return Math.max(0, EXAM_DURATION_SECONDS - effectiveElapsed);
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
