import { useState, useEffect } from 'react';

interface StreakDisplayProps {
  streak: number;
  animate?: boolean;
}

export function StreakDisplay({ streak, animate = false }: StreakDisplayProps) {
  const [showPop, setShowPop] = useState(false);

  useEffect(() => {
    if (animate && streak > 0) {
      setShowPop(true);
      const timer = setTimeout(() => setShowPop(false), 300);
      return () => clearTimeout(timer);
    }
  }, [streak, animate]);

  if (streak === 0) {
    return null;
  }

  // Color progression based on streak
  const getStreakStyle = () => {
    if (streak >= 20) {
      return {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        icon: 'text-purple-400',
        glow: 'shadow-purple-500/30',
      };
    }
    if (streak >= 10) {
      return {
        bg: 'bg-rose-500/20',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        icon: 'text-rose-400',
        glow: 'shadow-rose-500/30',
      };
    }
    if (streak >= 5) {
      return {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        icon: 'text-orange-400',
        glow: 'shadow-orange-500/30',
      };
    }
    return {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: 'text-amber-400',
      glow: 'shadow-amber-500/20',
    };
  };

  const style = getStreakStyle();
  const showFlame = streak >= 3;
  const showLightning = streak >= 10;

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-lg border
        ${style.bg} ${style.border}
        ${streak >= 10 ? `shadow-lg ${style.glow}` : ''}
        transition-all duration-200
      `}
    >
      {/* Fire/Lightning icon */}
      <div className={`relative ${showFlame ? 'animate-flame' : ''}`}>
        {showLightning ? (
          <svg
            className={`w-4 h-4 ${style.icon}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
          </svg>
        ) : showFlame ? (
          <svg
            className={`w-4 h-4 ${style.icon}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2c-5.33 4.55-8 8.48-8 12 0 4.42 3.58 8 8 8s8-3.58 8-8c0-3.52-2.67-7.45-8-12zm0 18c-3.31 0-6-2.69-6-6 0-2.24 1.61-4.78 4.95-8.03C12.97 7.91 16 11.35 16 14c0 3.31-1.79 6-4 6z" />
          </svg>
        ) : (
          <svg
            className={`w-4 h-4 ${style.icon}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )}
      </div>

      {/* Streak number */}
      <span
        className={`
          font-bold text-sm ${style.text}
          ${showPop ? 'animate-streak-pop' : ''}
        `}
      >
        {streak}
      </span>
    </div>
  );
}
