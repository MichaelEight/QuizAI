import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Task, AnswerOverride } from "./QuestionsTypes";
import { Settings } from "./SettingsType";
import AnswerField from "./AnswerComponent";
import { checkOpenAnswer } from "./backendService";
import { QuizProgress } from "./components/QuizProgress";

const QUIZ_PROGRESS_KEY = "quizai_quiz_progress";

interface QuizProgressState {
  taskPool: Task[];
  currentTask?: Task;
  areAnswersChecked: boolean;
  isRoundWon: boolean;
  isQuizStarted: boolean;
  isQuizEnded: boolean;
  openAnswer: string;
  openAnswerScore: number;
  learntQuestions: string[];  // Serialized Set
  correctAnswers: number;
  incorrectAnswers: number;
  tasksHash: string;  // To detect if tasks changed
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createPool(tasks: Task[], poolSize: number): Task[] {
  // Create poolSize copies of each question
  const pool: Task[] = [];
  for (const task of tasks) {
    for (let i = 0; i < poolSize; i++) {
      pool.push({ ...task, isRetry: false });
    }
  }
  return shuffleArray(pool);
}

// Create a hash from tasks to detect changes
function getTasksHash(tasks: readonly Task[]): string {
  return tasks.map(t => t.id).sort().join(",");
}

function loadQuizProgress(tasks: readonly Task[]): QuizProgressState | null {
  try {
    const stored = localStorage.getItem(QUIZ_PROGRESS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as QuizProgressState;
      // Only restore if tasks haven't changed
      if (parsed.tasksHash === getTasksHash(tasks)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading quiz progress:", error);
  }
  return null;
}

function saveQuizProgress(state: QuizProgressState): void {
  try {
    localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving quiz progress:", error);
  }
}

function clearQuizProgress(): void {
  try {
    localStorage.removeItem(QUIZ_PROGRESS_KEY);
  } catch (error) {
    console.error("Error clearing quiz progress:", error);
  }
}

export default function QuizPage({
  sourceText,
  tasks,
  setTasks,
  settings,
}: {
  readonly sourceText: string;
  readonly tasks: readonly Task[];
  readonly setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  readonly settings: Settings;
}) {
  // Load saved progress on initial render
  const savedProgress = tasks.length > 0 ? loadQuizProgress(tasks) : null;

  const [taskPool, setTaskPool] = useState<Task[]>(savedProgress?.taskPool ?? []);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(savedProgress?.currentTask);
  const [areAnswersChecked, setAreAnswersChecked] = useState<boolean>(savedProgress?.areAnswersChecked ?? false);
  const [isRoundWon, setIsRoundWon] = useState<boolean>(savedProgress?.isRoundWon ?? false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(savedProgress?.isQuizStarted ?? false);
  const [isQuizEnded, setIsQuizEnded] = useState<boolean>(savedProgress?.isQuizEnded ?? false);

  const [openAnswer, setOpenAnswer] = useState<string>(savedProgress?.openAnswer ?? "");
  const [openAnswerScore, setOpenAnswerScore] = useState<number>(savedProgress?.openAnswerScore ?? 0);

  const [learntQuestions, setLearntQuestions] = useState<Set<string>>(
    new Set(savedProgress?.learntQuestions ?? [])
  );
  const [correctAnswers, setCorrectAnswers] = useState<number>(savedProgress?.correctAnswers ?? 0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<number>(savedProgress?.incorrectAnswers ?? 0);
  const [showEndQuizModal, setShowEndQuizModal] = useState<boolean>(false);

  const totalQuestions = tasks.length;

  // Save progress whenever relevant state changes
  const saveProgress = useCallback(() => {
    if (tasks.length === 0) return;

    const state: QuizProgressState = {
      taskPool,
      currentTask,
      areAnswersChecked,
      isRoundWon,
      isQuizStarted,
      isQuizEnded,
      openAnswer,
      openAnswerScore,
      learntQuestions: Array.from(learntQuestions),
      correctAnswers,
      incorrectAnswers,
      tasksHash: getTasksHash(tasks),
    };
    saveQuizProgress(state);
  }, [
    taskPool, currentTask, areAnswersChecked, isRoundWon, isQuizStarted,
    isQuizEnded, openAnswer, openAnswerScore, learntQuestions,
    correctAnswers, incorrectAnswers, tasks
  ]);

  // Save progress on state changes
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  useEffect(() => {
    createPoolIfEmpty();
  }, []);

  const createPoolIfEmpty = () => {
    if (taskPool.length === 0 && tasks?.length > 0 && !isQuizStarted) {
      setTaskPool(createPool([...tasks], settings.defaultPoolSize));
    }
  };

  function resetRound() {
    setAreAnswersChecked(false);
    setIsRoundWon(false);
    setOpenAnswer("");
    setIsChecking(false);
  }

  function resetQuiz() {
    resetRound();
    setCurrentTask(undefined);
    setIsQuizStarted(false);
    setIsQuizEnded(false);
    setLearntQuestions(new Set());
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setTaskPool(createPool([...tasks], settings.defaultPoolSize));
    clearQuizProgress();
  }

  const handleCheckAnswersClick = async () => {
    setIsChecking(true);

    if (currentTask?.question.isOpen) {
      // Get accepted answer from task if exists (for future retries)
      const acceptedAnswer = currentTask.answerOverride?.acceptedOpenAnswer;
      const result = await checkOpenAnswer(
        sourceText,
        currentTask.question.value,
        openAnswer,
        acceptedAnswer,
      );
      if (result === -1) {
        console.error("Error during checking open answer");
        setIsChecking(false);
        return;
      }

      const won = result >= 51;
      setIsRoundWon(won);
      setAreAnswersChecked(true);
      setOpenAnswerScore(result);

      if (won) {
        setCorrectAnswers((prev) => prev + 1);
        setLearntQuestions((prev) => new Set(prev).add(currentTask.id));
      } else {
        setIncorrectAnswers((prev) => prev + 1);
        // Determine how many copies to add based on whether this is a retry
        const copiesToAdd = currentTask.isRetry
          ? settings.failedRetryCopies
          : settings.failedOriginalCopies;

        const newCopies: Task[] = [];
        for (let i = 0; i < copiesToAdd; i++) {
          newCopies.push({
            ...currentTask,
            isRetry: true,
            answers: currentTask.answers?.map((answer) => ({
              ...answer,
              isSelected: false,
            })),
          });
        }
        setTaskPool((prevTaskPool) =>
          shuffleArray([...prevTaskPool, ...newCopies]),
        );
      }

      setIsChecking(false);
      return;
    }

    const maxPoints = currentTask?.answers?.filter(
      (answer) => answer.isCorrect,
    ).length;

    let currentPoints = 0;
    if (currentTask?.answers) {
      for (const answer of currentTask.answers) {
        if (answer.isSelected) {
          currentPoints += answer.isCorrect ? 1 : -1;
        }
      }
    }

    const isMaxPointsScored = currentPoints === maxPoints;

    if (isMaxPointsScored && currentTask) {
      setCorrectAnswers((prev) => prev + 1);
      setLearntQuestions((prev) => new Set(prev).add(currentTask.id));
    } else if (currentTask) {
      setIncorrectAnswers((prev) => prev + 1);
      // Determine how many copies to add based on whether this is a retry
      const copiesToAdd = currentTask.isRetry
        ? settings.failedRetryCopies
        : settings.failedOriginalCopies;

      const newCopies: Task[] = [];
      for (let i = 0; i < copiesToAdd; i++) {
        newCopies.push({
          ...currentTask,
          isRetry: true,
          answers: currentTask.answers?.map((answer) => ({
            ...answer,
            isSelected: false,
          })),
        });
      }
      setTaskPool((prevTaskPool) =>
        shuffleArray([...prevTaskPool, ...newCopies]),
      );
    }

    setIsRoundWon(isMaxPointsScored);
    setAreAnswersChecked(true);
    setIsChecking(false);
  };

  const handleNextQuestionClick = () => {
    resetRound();

    if (taskPool.length === 0) {
      setIsQuizEnded(true);
      return;
    }

    const [nextTask, ...remainingTasks] = taskPool;
    setCurrentTask(nextTask);
    setTaskPool(remainingTasks);
  };

  const handleStartQuiz = () => {
    handleNextQuestionClick();
    setIsQuizStarted(true);
  };

  const handleAcceptMyAnswer = () => {
    if (!currentTask) return;

    const override: AnswerOverride = {
      overriddenAt: Date.now(),
    };

    if (currentTask.question.isOpen) {
      // For open questions: store the user's answer as accepted
      override.acceptedOpenAnswer = openAnswer;
    } else {
      // For closed questions: store indices of selected answers as correct
      const selectedIndices = currentTask.answers
        ?.map((a, i) => a.isSelected ? i : -1)
        .filter(i => i !== -1) ?? [];
      override.correctAnswerIndices = selectedIndices;
    }

    // Update the main tasks array with the override
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === currentTask.id
          ? { ...t, answerOverride: override }
          : t
      )
    );

    // Update all pool instances with the new correct answers
    setTaskPool(prevPool =>
      prevPool.map(poolTask => {
        if (poolTask.id !== currentTask.id) return poolTask;

        if (currentTask.question.isOpen) {
          // Just add the override, AI will handle it during checking
          return { ...poolTask, answerOverride: override };
        } else {
          // Update isCorrect on answers to match user selection
          const updatedAnswers = poolTask.answers?.map((a, i) => ({
            ...a,
            isCorrect: override.correctAnswerIndices?.includes(i) ?? false,
            isSelected: false,
          }));
          return { ...poolTask, answers: updatedAnswers, answerOverride: override };
        }
      })
    );

    // If was marked incorrect, flip to correct and update counters
    if (!isRoundWon) {
      setIsRoundWon(true);
      setCorrectAnswers(prev => prev + 1);
      setIncorrectAnswers(prev => Math.max(0, prev - 1));
      setLearntQuestions(prev => new Set(prev).add(currentTask.id));

      // Remove retry copies that were added for this question
      setTaskPool(prevPool =>
        prevPool.filter(t => !(t.id === currentTask.id && t.isRetry))
      );
    }
  };

  const handleRemoveQuestion = () => {
    if (!currentTask) return;

    // Mark task as removed in main tasks array
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === currentTask.id
          ? { ...t, isRemoved: true }
          : t
      )
    );

    // Remove all instances from pool
    setTaskPool(prevPool =>
      prevPool.filter(t => t.id !== currentTask.id)
    );

    // Remove from learnt set and adjust counters
    setLearntQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentTask.id);
      return newSet;
    });

    // Undo the correct/incorrect count for this question's last check
    if (isRoundWon) {
      setCorrectAnswers(prev => Math.max(0, prev - 1));
    } else {
      setIncorrectAnswers(prev => Math.max(0, prev - 1));
    }

    // Auto-advance to next question
    resetRound();
    const remainingPool = taskPool.filter(t => t.id !== currentTask.id);
    if (remainingPool.length === 0) {
      setIsQuizEnded(true);
      setCurrentTask(undefined);
    } else {
      const [nextTask, ...rest] = remainingPool;
      setCurrentTask(nextTask);
      setTaskPool(rest);
    }
  };

  // No tasks available
  if (!tasks || tasks.length === 0) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">No Quiz Available</h2>
        <p className="text-slate-400 mb-6">Generate some questions first to start the quiz</p>
        <Link
          to="/sourcePage"
          className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg px-6 py-3 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate Questions
        </Link>
      </div>
    );
  }

  // Quiz not started
  if (!isQuizStarted) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-100 mb-2">Ready to Start?</h2>
        <p className="text-slate-400 mb-8">
          You have <span className="text-indigo-400 font-medium">{totalQuestions}</span> questions waiting for you
        </p>
        <button
          onClick={handleStartQuiz}
          className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Quiz
        </button>
      </div>
    );
  }

  // Quiz ended
  if (isQuizEnded) {
    const totalAnswers = correctAnswers + incorrectAnswers;
    const accuracyPercent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    return (
      <div className="animate-fade-in max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-100 mb-2">Quiz Complete!</h2>
        <p className="text-slate-400 mb-6">
          You learnt all <span className="text-emerald-400 font-medium">{learntQuestions.size}</span> questions
        </p>

        {/* Final Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-400">{correctAnswers}</p>
            <p className="text-sm text-slate-400">Correct</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-rose-400">{incorrectAnswers}</p>
            <p className="text-sm text-slate-400">Incorrect</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-indigo-400">{accuracyPercent}%</p>
            <p className="text-sm text-slate-400">Accuracy</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={resetQuiz}
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg px-6 py-3 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          <Link
            to="/sourcePage"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-lg px-6 py-3 transition-all duration-200"
          >
            New Quiz
          </Link>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* End Quiz Confirmation Modal */}
      {showEndQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowEndQuizModal(false)}
          />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-black/50 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">End Quiz?</h2>
                <p className="text-sm text-slate-400">Your progress will be lost</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to end this quiz? All current progress will be reset.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEndQuizModal(false);
                  resetQuiz();
                }}
                className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-medium rounded-lg px-4 py-3 transition-all duration-200"
              >
                Yes, End Quiz
              </button>
              <button
                onClick={() => setShowEndQuizModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-lg px-4 py-3 transition-all duration-200"
              >
                No, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Quiz button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowEndQuizModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all duration-200"
          title="End quiz"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          End Quiz
        </button>
      </div>

      {/* Progress bars */}
      <QuizProgress
        totalQuestions={totalQuestions}
        learntCount={learntQuestions.size}
        correctAnswers={correctAnswers}
        incorrectAnswers={incorrectAnswers}
      />

      {/* Question Card */}
      {currentTask && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg shadow-black/20 mb-6">
          {/* Question header */}
          <div className="flex items-start gap-3 mb-6">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-semibold shrink-0">
              Q
            </span>
            <h2 className="text-xl font-semibold text-slate-100">{currentTask.question.value}</h2>
          </div>

          {/* Question type badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              currentTask.question.isOpen
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}>
              {currentTask.question.isOpen ? "Open Question" : "Multiple Choice"}
            </span>
          </div>

          {/* Answers */}
          <AnswerField
            openAnswer={openAnswer}
            setOpenAnswer={setOpenAnswer}
            currentTask={currentTask}
            setCurrentTask={setCurrentTask}
            areAnswersChecked={areAnswersChecked}
          />
        </div>
      )}

      {/* Feedback */}
      {areAnswersChecked && (
        <div className={`mb-6 p-4 rounded-xl border ${
          isRoundWon
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-rose-500/10 border-rose-500/20"
        } animate-fade-in`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isRoundWon ? "bg-emerald-500/20" : "bg-rose-500/20"
              }`}>
                {isRoundWon ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`font-semibold ${isRoundWon ? "text-emerald-400" : "text-rose-400"}`}>
                  {isRoundWon ? "Correct!" : "Incorrect"}
                </p>
                {currentTask?.question.isOpen && (
                  <p className="text-sm text-slate-400">
                    You scored <span className={isRoundWon ? "text-emerald-400" : "text-rose-400"}>{openAnswerScore}</span>/100 points
                  </p>
                )}
              </div>
            </div>
            {/* Disagree buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleAcceptMyAnswer}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg transition-all duration-200"
                title="Mark my answer as correct"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept My Answer
              </button>
              <button
                onClick={handleRemoveQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-rose-500/20 border border-slate-600 hover:border-rose-500/30 rounded-lg transition-all duration-200"
                title="Remove this question from the quiz"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleCheckAnswersClick}
          disabled={areAnswersChecked || isChecking}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${
            areAnswersChecked || isChecking
              ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
              : "bg-indigo-500 hover:bg-indigo-400 text-white active:scale-[0.98]"
          }`}
        >
          {isChecking ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Checking...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check Answer
            </>
          )}
        </button>
        <button
          onClick={handleNextQuestionClick}
          disabled={!areAnswersChecked}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${
            areAnswersChecked
              ? "bg-slate-700 hover:bg-slate-600 text-slate-100 active:scale-[0.98]"
              : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Next Question
        </button>
      </div>
    </div>
  );
}
