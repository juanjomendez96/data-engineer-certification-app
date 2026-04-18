'use client';

interface ScoreGaugeProps {
  percentage: number;
  passed: boolean;
}

export function ScoreGauge({ percentage, passed }: ScoreGaugeProps) {
  const cx = 100;
  const cy = 90;
  const r = 72;
  const strokeWidth = 13;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (startDeg: number, endDeg: number) => {
    const start = {
      x: cx + r * Math.cos(toRad(startDeg)),
      y: cy + r * Math.sin(toRad(startDeg)),
    };
    const end = {
      x: cx + r * Math.cos(toRad(endDeg)),
      y: cy + r * Math.sin(toRad(endDeg)),
    };
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const scoreDeg = 180 - (percentage / 100) * 180;
  const thresholdDeg = 180 - (70 / 100) * 180;

  const fillColor = passed ? '#22c55e' : '#ef4444';
  const trackColor = passed ? '#22c55e33' : '#ef444433';

  const markerX = cx + r * Math.cos(toRad(thresholdDeg));
  const markerY = cy - r * Math.sin(toRad(thresholdDeg));
  const innerX = cx + (r - strokeWidth - 3) * Math.cos(toRad(thresholdDeg));
  const innerY = cy - (r - strokeWidth - 3) * Math.sin(toRad(thresholdDeg));

  return (
    <svg viewBox="0 0 200 138" className="w-48 h-auto text-ink-primary" aria-label={`Score: ${percentage}%`}>
      {/* Track */}
      <path
        d={arcPath(180, 0)}
        fill="none"
        stroke="var(--canvas-hover)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Colored fill arc */}
      {percentage > 0 && (
        <path
          d={arcPath(180, scoreDeg)}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
      {/* 70% threshold marker */}
      <line
        x1={innerX} y1={innerY}
        x2={markerX} y2={markerY}
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Percentage */}
      <text
        x={cx} y={cy + 6}
        textAnchor="middle"
        fill="currentColor"
        fontSize={26}
        fontWeight="bold"
        fontFamily="inherit"
      >
        {percentage.toFixed(1)}%
      </text>
      {/* PASS / FAIL badge background */}
      <rect
        x={cx - 28} y={cy + 18}
        width={56} height={20}
        rx={10}
        fill={trackColor}
      />
      {/* PASS / FAIL label */}
      <text
        x={cx} y={cy + 32}
        textAnchor="middle"
        fill={fillColor}
        fontSize={12}
        fontWeight="bold"
        fontFamily="inherit"
        letterSpacing="1"
      >
        {passed ? 'PASS' : 'FAIL'}
      </text>
    </svg>
  );
}
