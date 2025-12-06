interface QuizProgressProps {
  totalQuestions: number;
  learntCount: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export function QuizProgress({
  totalQuestions,
  learntCount,
  correctAnswers,
  incorrectAnswers,
}: QuizProgressProps) {
  const learntPercentage = totalQuestions > 0 ? (learntCount / totalQuestions) * 100 : 0;
  const totalAnswers = correctAnswers + incorrectAnswers;
  const correctPercentage = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 50;

  return (
    <div className="space-y-4 mb-8">
      {/* Learning Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Learning</span>
          <span className="text-slate-300">
            <span className="text-emerald-400 font-medium">{learntCount}</span>
            <span className="text-slate-500"> / </span>
            <span>{totalQuestions}</span>
            <span className="text-slate-500"> learnt</span>
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${learntPercentage}%`,
              background: learntCount > 0
                ? 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)'
                : 'transparent',
            }}
          />
        </div>
      </div>

      {/* Answer Quality Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-emerald-400 font-medium">
            {correctAnswers} correct
          </span>
          <span className="text-rose-400 font-medium">
            {incorrectAnswers} incorrect
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden relative">
          {totalAnswers > 0 ? (
            <>
              {/* Green bar from left */}
              <div
                className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${correctPercentage}%` }}
              />
              {/* Red bar from right */}
              <div
                className="absolute right-0 top-0 h-full bg-rose-500 transition-all duration-500 ease-out"
                style={{ width: `${100 - correctPercentage}%` }}
              />
            </>
          ) : (
            <div className="w-full h-full bg-slate-600" />
          )}
        </div>
      </div>
    </div>
  );
}
