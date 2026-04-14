export const EXAM_DURATION_SECONDS = 5400; // 90 * 60

export function computeRemaining(startTimestamp: number): number {
  const elapsed = (Date.now() - startTimestamp) / 1000;
  return Math.max(0, EXAM_DURATION_SECONDS - elapsed);
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
