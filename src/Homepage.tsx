import { Link, useNavigate } from "react-router";
import { useGamification } from "./context/GamificationContext";
import { useQuizLibrary } from "./context/QuizLibraryContext";
import { SavedQuiz } from "./types/quizLibrary";
import { Task } from "./QuestionsTypes";

interface HomepageProps {
  setTasks: (tasks: Task[]) => void;
  setSourceText: (text: string) => void;
}

export default function Homepage({ setTasks, setSourceText }: HomepageProps) {
  const navigate = useNavigate();
  const { userStats } = useGamification();
  const { quizzes } = useQuizLibrary();

  const hasActivity =
    userStats.totalQuestionsAnswered > 0 || userStats.totalPoints > 0;
  const accuracy =
    userStats.totalQuestionsAnswered > 0
      ? Math.round(
          (userStats.totalCorrectAnswers / userStats.totalQuestionsAnswered) * 100
        )
      : 0;

  const recent = [...quizzes].sort((a, b) => b.updatedAt - a.updatedAt);
  const lastQuiz = recent[0];

  const loadQuiz = (quiz: SavedQuiz) => {
    setTasks(quiz.tasks);
    setSourceText(quiz.sourceText);
    navigate("/quizPage", {
      state: { loadedQuizId: quiz.id, loadedQuizVersion: quiz.version || 1 },
    });
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Greeting */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-400">{greeting} 👋</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            {hasActivity ? "Ready for another round?" : "Let's build your first quiz"}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-slate-400">
            Turn any notes, PDF, or text into an interactive quiz — then learn it
            through smart spaced repetition.
          </p>
        </div>
      </header>

      {/* Stats */}
      {hasActivity && (
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Points"
            value={userStats.totalPoints.toLocaleString()}
            tone="indigo"
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.9z" />
            }
          />
          <StatCard
            label="Current streak"
            value={`${userStats.currentStreak}`}
            tone="amber"
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c.5 3-1.5 4.5-3 6.5S7 14 9 15c.4-1 1.2-1.8 2-2.5.3 2 1.7 2.8 2.4 4.3.8 1.7-.2 4.2-2.4 4.2C7.6 21 5 18.4 5 14.8 5 10 9.5 8.5 12 3Z" />
            }
          />
          <StatCard
            label="Quizzes done"
            value={`${userStats.totalQuizzesCompleted}`}
            tone="emerald"
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m5 13 4 4 10-11" />
            }
          />
          <StatCard
            label="Accuracy"
            value={`${accuracy}%`}
            tone="violet"
            icon={
              <>
                <circle cx="12" cy="12" r="8.5" strokeWidth={1.8} />
                <circle cx="12" cy="12" r="3.5" strokeWidth={1.8} />
              </>
            }
          />
        </section>
      )}

      {/* Primary actions */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Generate */}
        <Link
          to="/sourcePage"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5"
        >
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 transition-transform group-hover:scale-125" />
          <div className="relative">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14M12 5v14" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold">Generate a quiz</h2>
            <p className="mt-1 text-sm text-indigo-100">
              Paste text or upload files and let AI write the questions.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
              Start creating
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </span>
          </div>
        </Link>

        {/* Continue / Library */}
        {lastQuiz ? (
          <button
            onClick={() => loadQuiz(lastQuiz)}
            className="group rounded-2xl border border-slate-700 bg-slate-800 p-6 text-left shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 hover:border-indigo-500/50"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 6.5v11l9-5.5z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-100">Continue studying</h2>
            <p className="mt-1 line-clamp-1 text-sm text-slate-400">
              {lastQuiz.title} · {lastQuiz.tasks.length} questions
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400">
              Resume quiz
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </span>
          </button>
        ) : (
          <Link
            to="/library"
            className="group rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 hover:border-indigo-500/50"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5h6v14H5zM13 5h6v14h-6z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-100">Your library</h2>
            <p className="mt-1 text-sm text-slate-400">
              Save quizzes, organize by subject, and revisit them anytime.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400">
              Browse library
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </span>
          </Link>
        )}
      </section>

      {/* Recent quizzes */}
      {recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100">Recent quizzes</h2>
            <Link to="/library" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-700 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
            {recent.slice(0, 5).map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => loadQuiz(quiz)}
                className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-slate-700/40"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/15 text-sm font-bold text-indigo-400">
                  {quiz.title.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-100">{quiz.title}</p>
                  <p className="truncate text-xs text-slate-400">
                    {quiz.subjectName ? `${quiz.subjectName} · ` : ""}
                    {quiz.tasks.length} questions
                  </p>
                </div>
                <span className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400 transition-colors group-hover:bg-emerald-500/25 sm:inline-flex">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 6.5v11l9-5.5z" />
                  </svg>
                  Start
                </span>
                <svg className="h-5 w-5 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 6 6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* First-run guide */}
      {!hasActivity && recent.length === 0 && (
        <section className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-base font-semibold text-slate-100">How it works</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            <Step n="1" title="Add your source" desc="Paste text or drop in a PDF, slides, or notes." />
            <Step n="2" title="Generate questions" desc="AI writes multiple-choice and open questions." />
            <Step n="3" title="Study & master" desc="Answer, get hints, and repeat what you miss." />
          </div>
        </section>
      )}
    </div>
  );
}

const TONES = {
  indigo: "bg-indigo-500/15 text-indigo-400",
  amber: "bg-amber-500/15 text-amber-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  violet: "bg-violet-500/15 text-violet-400",
} as const;

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: keyof typeof TONES;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-lg shadow-black/20">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${TONES[tone]}`}>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-100">{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-500 text-sm font-bold text-white">
        {n}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-400">{desc}</p>
      </div>
    </div>
  );
}
