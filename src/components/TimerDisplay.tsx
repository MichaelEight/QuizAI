import { useState, useEffect } from 'react';

interface TimerDisplayProps {
  startTime: number | null;
  isRunning?: boolean;
}

export function TimerDisplay({ startTime, isRunning = true }: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime || !isRunning) {
      setElapsed(0);
      return;
    }

    // Update immediately
    setElapsed(Date.now() - startTime);

    // Update every 100ms for smooth display
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, isRunning]);

  if (!startTime) {
    return null;
  }

  const seconds = elapsed / 1000;
  const isWarning = seconds > 30;
  const isSlow = seconds > 20;

  // Format time
  const formatTime = () => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-lg border
        ${isWarning
          ? 'bg-rose-50 border-rose-200'
          : isSlow
          ? 'bg-amber-50 border-amber-200'
          : 'bg-slate-100 border-slate-300'
        }
        transition-colors duration-200
      `}
    >
      {/* Clock icon */}
      <svg
        className={`w-4 h-4 ${
          isWarning
            ? 'text-rose-600 animate-timer-warning'
            : isSlow
            ? 'text-amber-600'
            : 'text-slate-500'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Time display */}
      <span
        className={`
          font-mono text-sm font-medium
          ${isWarning ? 'text-rose-600' : isSlow ? 'text-amber-600' : 'text-slate-600'}
        `}
      >
        {formatTime()}
      </span>
    </div>
  );
}

// Static display for showing recorded times
interface TimeStatDisplayProps {
  label: string;
  timeMs: number | null;
  variant?: 'default' | 'best' | 'average';
}

export function TimeStatDisplay({ label, timeMs, variant = 'default' }: TimeStatDisplayProps) {
  if (timeMs === null) {
    return null;
  }

  const seconds = timeMs / 1000;
  const formatTime = () => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = {
    default: 'text-slate-500',
    best: 'text-emerald-600',
    average: 'text-indigo-600',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-400">{label}:</span>
      <span className={`font-mono font-medium ${styles[variant]}`}>
        {formatTime()}
      </span>
    </div>
  );
}
