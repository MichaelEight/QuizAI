import { useState, useEffect } from 'react';

interface TimerDisplayProps {
  startTime: number | null;
  isRunning?: boolean;
  /**
   * "question" (default) = per-question timer with slow/warning colors.
   * "total" = whole-quiz timer, neutral colors, always mm:ss.
   * When a frozen end time is given, the timer stops there instead of "now".
   */
  variant?: 'question' | 'total';
  /** Freeze the elapsed value at this epoch ms (e.g. when the quiz finished). */
  endTime?: number | null;
}

export function TimerDisplay({
  startTime,
  isRunning = true,
  variant = 'question',
  endTime = null,
}: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    // Frozen at a fixed end time — no ticking needed.
    if (endTime !== null) {
      setElapsed(endTime - startTime);
      return;
    }

    if (!isRunning) {
      setElapsed(Date.now() - startTime);
      return;
    }

    // Update immediately
    setElapsed(Date.now() - startTime);

    // Update every 100ms for smooth display
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, isRunning, endTime]);

  if (!startTime) {
    return null;
  }

  const seconds = elapsed / 1000;
  const isTotal = variant === 'total';
  const isWarning = !isTotal && seconds > 30;
  const isSlow = !isTotal && seconds > 20;

  // Format time. Per-question shows tenths under a minute; total always mm:ss
  // (and h:mm:ss past an hour).
  const formatTime = () => {
    if (!isTotal && seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const total = Math.floor(seconds);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      title={isTotal ? 'Total quiz time' : 'Time on this question'}
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-lg border
        ${isWarning
          ? 'bg-rose-500/10 border-rose-500/20'
          : isSlow
          ? 'bg-amber-500/10 border-amber-500/20'
          : 'bg-slate-700/50 border-slate-600'
        }
        transition-colors duration-200
      `}
    >
      {/* Clock icon */}
      <svg
        className={`w-4 h-4 ${
          isWarning
            ? 'text-rose-400 animate-timer-warning'
            : isSlow
            ? 'text-amber-400'
            : 'text-slate-400'
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
          ${isWarning ? 'text-rose-400' : isSlow ? 'text-amber-400' : 'text-slate-300'}
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
    default: 'text-slate-400',
    best: 'text-emerald-400',
    average: 'text-indigo-400',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">{label}:</span>
      <span className={`font-mono font-medium ${styles[variant]}`}>
        {formatTime()}
      </span>
    </div>
  );
}
