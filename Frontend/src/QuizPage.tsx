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
  const [currentTask, setCurrentTask] = useState<Task>();
  const [areAnswersChecked, setAreAnswersChecked] = useState<boolean>(false);
  const [isRoundWon, setIsRoundWon] = useState<boolean>(false);

  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(false); // Before first question
  const [isQuizEnded, setIsQuizEnded] = useState<boolean>(false); // After last question

  const [openAnswer, setOpenAnswer] = useState<string>("");
  const [openAnswerScore, setOpenAnswerScore] = useState<number>(0);

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

  const handleCheckAnswersClick = async () => {
    // Handle open question
    if (currentTask?.question.isOpen) {
      const result = await checkOpenAnswer(
        sourceText,
        currentTask.question.value,
        openAnswer,
      );
      if (result == -1) {
        console.error(
          "Error during checking open answer. User allowed to skip question or repeat it",
        );
        // Enable next question
        return;
      }

      // If scored at least 51 pts, win
      setIsRoundWon(result >= 51);
      setAreAnswersChecked(true);
      setOpenAnswerScore(result);

      // TODO: Refactor repetition
      if (!isRoundWon) {
        // create a copy of currentTask, but reset the answers
        const taskCopy: Task = {
          ...currentTask,
          answers: currentTask.answers?.map((answer) => ({
            ...answer,
            isSelected: false,
          })),
        };

        // Add 2 same tasks to the pool and reshuffle it
        setTaskPool((prevTaskPool) =>
          shuffleArray([...prevTaskPool, taskCopy, taskCopy]),
        );
      }

      return;
    }

    // Handle closed question
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

    const isMaxPointsSCored = currentPoints == maxPoints;

    if (!isMaxPointsSCored && currentTask) {
      // create a copy of currentTask, but reset the answers
      const taskCopy: Task = {
        ...currentTask,
        answers: currentTask.answers?.map((answer) => ({
          ...answer,
          isSelected: false,
        })),
      };

      // Add 2 same tasks to the pool and reshuffle it
      setTaskPool((prevTaskPool) =>
        shuffleArray([...prevTaskPool, taskCopy, taskCopy]),
      );
    }

    setIsRoundWon(isMaxPointsSCored);
    setAreAnswersChecked(true);
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
      <h2 className={`${quizPageStyles.pageHeader}`}>Quiz Page</h2>

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
            className={`${quizPageStyles.defaultActionButton} ${areAnswersChecked ? quizPageStyles.disabledActionButton : ""}`}
            disabled={areAnswersChecked}
            onClick={handleCheckAnswersClick}>
            Check answers
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
