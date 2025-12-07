import { useState, useEffect, useRef } from 'react';

interface PointsDisplayProps {
  points: number;
  showFloating?: boolean;
}

export function PointsDisplay({ points, showFloating = true }: PointsDisplayProps) {
  const [floatingPoints, setFloatingPoints] = useState<{ id: number; value: number }[]>([]);
  const prevPointsRef = useRef(points);
  const idCounterRef = useRef(0);

  useEffect(() => {
    const diff = points - prevPointsRef.current;
    if (diff > 0 && showFloating) {
      const newFloat = { id: idCounterRef.current++, value: diff };
      setFloatingPoints(prev => [...prev, newFloat]);

      // Remove after animation
      setTimeout(() => {
        setFloatingPoints(prev => prev.filter(f => f.id !== newFloat.id));
      }, 1200);
    }
    prevPointsRef.current = points;
  }, [points, showFloating]);

  return (
    <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
      {/* Star icon */}
      <svg
        className="w-4 h-4 text-indigo-400"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>

      {/* Points number */}
      <span className="font-bold text-sm text-indigo-400">
        {points.toLocaleString()}
      </span>

      {/* Floating points */}
      {floatingPoints.map(fp => (
        <div
          key={fp.id}
          className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none animate-points-float"
        >
          <span className="text-emerald-400 font-bold text-sm whitespace-nowrap">
            +{fp.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Compact version for inline display
interface PointsBadgeProps {
  points: number;
  size?: 'sm' | 'md';
}

export function PointsBadge({ points, size = 'sm' }: PointsBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full
        bg-indigo-500/10 text-indigo-400 font-medium
        ${sizeClasses[size]}
      `}
    >
      <svg
        className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {points}
    </span>
  );
}

// Points breakdown tooltip/display
interface PointsBreakdownProps {
  base: number;
  timeMultiplier: number;
  streakMultiplier: number;
  total: number;
  bonusReasons: string[];
}

export function PointsBreakdown({
  base,
  timeMultiplier,
  streakMultiplier,
  total,
  bonusReasons,
}: PointsBreakdownProps) {
  if (total === 0) return null;

  return (
    <div className="text-sm space-y-1">
      <div className="flex justify-between text-slate-400">
        <span>Base:</span>
        <span>{base}</span>
      </div>
      {timeMultiplier !== 1 && (
        <div className="flex justify-between text-cyan-400">
          <span>Time bonus:</span>
          <span>x{timeMultiplier.toFixed(1)}</span>
        </div>
      )}
      {streakMultiplier !== 1 && (
        <div className="flex justify-between text-amber-400">
          <span>Streak bonus:</span>
          <span>x{streakMultiplier.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-indigo-400 font-medium border-t border-slate-700 pt-1">
        <span>Total:</span>
        <span>+{total}</span>
      </div>
      {bonusReasons.length > 0 && (
        <div className="text-xs text-slate-500 pt-1">
          {bonusReasons.join(' ')}
        </div>
      )}
    </div>
  );
}
