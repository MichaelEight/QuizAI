import { useMemo } from 'react';

interface GenerationProgressProps {
  currentType: string | null;
  currentAttempt: number;
  maxAttempts: number;
  questionsReceived: number;
  questionsTarget: number;
  typeBreakdown: {
    [key: string]: {
      received: number;
      target: number;
      complete: boolean;
    };
  };
  elapsedTime: number;
}

export function GenerationProgress({
  currentType,
  currentAttempt,
  maxAttempts,
  questionsReceived,
  questionsTarget,
  typeBreakdown,
  elapsedTime,
}: GenerationProgressProps) {
  // Calculate overall progress percentage
  const progressPercentage = useMemo(() => {
    if (questionsTarget === 0) return 0;
    return Math.min(Math.round((questionsReceived / questionsTarget) * 100), 100);
  }, [questionsReceived, questionsTarget]);

  // Format elapsed time as MM:SS
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedTime]);

  return (
    <div className="w-full space-y-4">
      {/* Main Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-slate-300 font-medium">
            {currentType ? `Generating ${currentType}` : 'Initializing...'}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              {questionsReceived} / {questionsTarget} questions
            </span>
            <span className="text-indigo-400 font-mono">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
          <span>{progressPercentage}% complete</span>
          {currentAttempt > 0 && (
            <span>Attempt {currentAttempt}/{maxAttempts}</span>
          )}
        </div>
      </div>

      {/* Type Breakdown */}
      {Object.keys(typeBreakdown).length > 0 && (
        <div className="space-y-2">
          {Object.entries(typeBreakdown).map(([typeName, info]) => (
            <div key={typeName} className="flex items-center gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {info.complete ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-indigo-400 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </div>

              {/* Type Name */}
              <span className={`text-sm flex-shrink-0 w-40 ${info.complete ? 'text-emerald-400' : 'text-slate-300'}`}>
                {typeName}
              </span>

              {/* Mini Progress Bar */}
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    info.complete ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.round((info.received / info.target) * 100)}%` }}
                />
              </div>

              {/* Count */}
              <span className="text-xs text-slate-400 flex-shrink-0 w-16 text-right">
                {info.received}/{info.target}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
