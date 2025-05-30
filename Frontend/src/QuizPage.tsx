import { useState, useEffect } from "react";
import { Task } from "./QuestionsTypes";
import { quizPageStyles } from "./PagesStyles";
import AnswerField from "./AnswerComponent";
import { checkOpenAnswer } from "./backendService";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
}

function createPool(tasks: Task[]): Task[] {
  return shuffleArray(tasks);
}

export default function QuizPage({
  sourceText,
  tasks,
}: {
  readonly sourceText: string;
  readonly tasks: readonly Task[];
}) {
  const [taskPool, setTaskPool] = useState<Task[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<Task>();
  const [areAnswersChecked, setAreAnswersChecked] = useState<boolean>(false);
  const [isRoundWon, setIsRoundWon] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  // Track which questions have been learned (answered correctly once)
  const [learnedSet, setLearnedSet] = useState<Set<string>>(new Set());

  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(false); // Before first question
  const [isQuizEnded, setIsQuizEnded] = useState<boolean>(false); // After last question

  const [openAnswer, setOpenAnswer] = useState<string>("");
  const [openAnswerScore, setOpenAnswerScore] = useState<number>(0);

  // Number of learned questions
  const learnedCount = learnedSet.size;

  // on page load, if taskPool is empty, create it
  useEffect(() => {
    createPoolIfEmpty();
  }, []);

  const createPoolIfEmpty = () => {
    if (taskPool.length == 0 && tasks?.length > 0) {
      setTaskPool(createPool([...tasks]));
    }
  };

  function resetRound() {
    setAreAnswersChecked(false);
    setIsRoundWon(false);
    setOpenAnswer("");
  }

  function resetQuiz() {
    resetRound();
    setCurrentTask(undefined);
    setIsQuizStarted(false);
    setIsQuizEnded(false);
  }

  // Process open question result
  const handleOpenCheck = async () => {
    const result = await checkOpenAnswer(
      sourceText,
      currentTask!.question.value,
      openAnswer,
    );
    const won = result >= 51;
    setIsRoundWon(won);
    setOpenAnswerScore(result);
    won ? setCorrectCount((c) => c + 1) : setIncorrectCount((i) => i + 1);
    if (won) {
      setLearnedSet((prev) => new Set(prev).add(currentTask!.question.value));
    }
    setAreAnswersChecked(true);
    if (!won) {
      const copy: Task = {
        ...currentTask!,
        answers: currentTask!.answers!.map((a) => ({
          ...a,
          isSelected: false,
        })),
      };
      setTaskPool((prev) => shuffleArray([...prev, copy, copy]));
    }
  };

  // Process closed question result
  const handleClosedCheck = () => {
    const answers = currentTask!.answers!;
    const maxPoints = answers.filter((a) => a.isCorrect).length;
    const points = answers.reduce((sum, a) => {
      if (a.isSelected) {
        return sum + (a.isCorrect ? 1 : -1);
      }
      return sum;
    }, 0);
    const won = points === maxPoints;
    setIsRoundWon(won);
    won ? setCorrectCount((c) => c + 1) : setIncorrectCount((i) => i + 1);
    if (won) {
      setLearnedSet((prev) => new Set(prev).add(currentTask!.question.value));
    }
    setAreAnswersChecked(true);
    if (!won) {
      const copy: Task = {
        ...currentTask!,
        answers: answers.map((a) => ({ ...a, isSelected: false })),
      };
      setTaskPool((prev) => shuffleArray([...prev, copy, copy]));
    }
  };

  // Unified check answers handler
  const handleCheckAnswersClick = async () => {
    if (!currentTask) return;
    setIsChecking(true);
    try {
      if (currentTask.question.isOpen) {
        await handleOpenCheck();
      } else {
        handleClosedCheck();
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleNextQuestionClick = () => {
    resetRound();

    if (tasks.length == 0) {
      console.log("No more questions!");
      setIsQuizEnded(true);
    }

    const [nextTask, ...remainingTasks] = taskPool;
    setCurrentTask(nextTask);
    setTaskPool(remainingTasks);
  };

  const handleStartQuiz = () => {
    handleNextQuestionClick();
    setIsQuizStarted(true);
  };

  const handleRestartQuiz = () => {
    resetQuiz();
    createPoolIfEmpty();
  };

  return (
    <div className="card">
      {/* title */}
      <h2 className={quizPageStyles.pageHeader}>Quiz Page</h2>
      {/* Progress Bars */}
      <div className="mb-4 space-y-4">
        {/* Correct vs Incorrect */}
        <div className="flex justify-between items-center text-sm text-gray-300">
          <span>Correct: {correctCount}</span>
          <span>Incorrect: {incorrectCount}</span>
        </div>
        <div className="w-full bg-red-600 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-500 h-2 transition-all"
            style={{
              width: `${
                correctCount + incorrectCount === 0
                  ? 100
                  : Math.round(
                      (correctCount / (correctCount + incorrectCount)) * 100,
                    )
              }%`,
            }}
          />
        </div>

        {/* Learned Questions */}
        <div className="flex justify-between items-center text-sm text-gray-300">
          <span>Learned: {learnedCount}</span>
          <span>Total: {tasks.length}</span>
        </div>
        <div className="w-full bg-red-600 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-500 h-2 transition-all"
            style={{
              width: `${tasks.length > 0 ? Math.round((learnedCount / tasks.length) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      {currentTask ? (
        <p className={`${quizPageStyles.questionHeader}`}>
          Q: {currentTask.question.value}
        </p>
      ) : (
        <p>No question loaded!</p>
      )}

      {/* Answers buttons */}
      {currentTask ? (
        <AnswerField
          openAnswer={openAnswer}
          setOpenAnswer={setOpenAnswer}
          currentTask={currentTask}
          setCurrentTask={setCurrentTask}
          areAnswersChecked={areAnswersChecked}
        />
      ) : (
        <p>No answers loaded!</p>
      )}

      {/* Action buttons */}
      {/* Start/End state */}
      {!isQuizStarted ? (
        <div className="mt-6 text-center">
          <button
            className={quizPageStyles.defaultActionButton}
            onClick={handleStartQuiz}>
            START
          </button>
        </div>
      ) : (
        <></>
      )}

      {/* End screen */}
      {isQuizEnded ? (
        <div className="mt-6 text-center">
          <h1 className={quizPageStyles.questionHeader}>
            YOU FINISHED THE QUIZ!
          </h1>
          <button
            className={quizPageStyles.defaultActionButton}
            onClick={handleRestartQuiz}>
            Restart Quiz
          </button>
        </div>
      ) : (
        <></>
      )}

      {/* Mid game state */}
      {isQuizStarted && !isQuizEnded ? (
        <div className="mt-10 grid grid-cols-2 gap-4">
          {/* Check answers button */}
          <button
            className={`${quizPageStyles.defaultActionButton} ${areAnswersChecked || isChecking ? quizPageStyles.disabledActionButton : ""}`}
            disabled={areAnswersChecked || isChecking}
            onClick={handleCheckAnswersClick}>
            {isChecking ? "Checking..." : "Check answers"}
          </button>
          {/* Next question button */}
          <button
            className={`${quizPageStyles.defaultActionButton} ${!areAnswersChecked ? quizPageStyles.disabledActionButton : ""}`}
            disabled={!areAnswersChecked}
            onClick={handleNextQuestionClick}>
            Next question
          </button>
        </div>
      ) : (
        <></>
      )}

      {/* ROUND STATUS */}
      {areAnswersChecked ? (
        <div className="mt-6 text-center">
          <p className="font-semibold text-lg">
            {isRoundWon ? "Correct!" : "Incorrect!"}
          </p>
          {currentTask?.question.isOpen ? (
            <p className="text-sm mt-2">
              You scored {openAnswerScore} out of 100 points.
            </p>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
