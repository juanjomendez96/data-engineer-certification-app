'use client';

interface ScoreGaugeProps {
  percentage: number;
  passed: boolean;
}

export function ScoreGauge({ percentage, passed }: ScoreGaugeProps) {
  const cx = 100;
  const cy = 100;
  const r = 80;
  const strokeWidth = 14;

  // Semicircle: from 180deg (left) to 0deg (right)
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

  // Map percentage 0–100 to degrees 180–0 (going clockwise from left to right)
  const scoreDeg = 180 - (percentage / 100) * 180;
  const thresholdDeg = 180 - (70 / 100) * 180;

  const fillColor = passed ? '#48BB78' : '#FC8181';

  // Marker at 70%
  const markerX = cx + r * Math.cos(toRad(thresholdDeg));
  const markerY = cy + r * Math.sin(toRad(thresholdDeg));
  const innerX = cx + (r - strokeWidth - 4) * Math.cos(toRad(thresholdDeg));
  const innerY = cy + (r - strokeWidth - 4) * Math.sin(toRad(thresholdDeg));

  return (
    <svg viewBox="0 0 200 120" className="w-48 h-auto" aria-label={`Score: ${percentage}%`}>
      {/* Background arc */}
      <path
        d={arcPath(180, 0)}
        fill="none"
        stroke="#2D3748"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Score arc */}
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
        x1={innerX}
        y1={innerY}
        x2={markerX}
        y2={markerY}
        stroke="white"
        strokeWidth={2}
      />
      {/* Score text */}
      <text x={cx} y={cy + 10} textAnchor="middle" fill="white" fontSize={22} fontWeight="bold">
        {percentage.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill={passed ? '#48BB78' : '#FC8181'} fontSize={12} fontWeight="bold">
        {passed ? 'PASS' : 'FAIL'}
      </text>
    </svg>
  );
}
