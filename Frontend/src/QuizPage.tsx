import { useState, useEffect } from "react";
import { Task } from "./QuestionsTypes";
import { quizPageStyles } from "./PagesStyles";
import AnswerField from "./AnswerComponent";

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
  tasks,
}: {
  readonly tasks: readonly Task[];
}) {
  const [taskPool, setTaskPool] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task>();
  const [areAnswersChecked, setAreAnswersChecked] = useState<boolean>(false);
  const [isRoundWon, setIsRoundWon] = useState<boolean>(false);

  const [openAnswer, setOpenAnswer] = useState<string>("");

  // on page load, if taskPool is empty, create it
  useEffect(() => {
    if (taskPool.length == 0 && tasks?.length > 0) {
      setTaskPool(createPool([...tasks]));
    }
  }, []);

  const handleCheckAnswersClick = () => {
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

    setIsRoundWon(currentPoints == maxPoints);
    setAreAnswersChecked(true);
  };

  function resetRound() {
    setAreAnswersChecked(false);
    setIsRoundWon(false);
  }

  const handleNextQuestionClick = () => {
    resetRound();

    if (tasks.length == 0) {
      console.log("No more questions!");
    }

    const [nextTask, ...remainingTasks] = taskPool;
    setCurrentTask(nextTask);
    setTaskPool(remainingTasks);
  };

  return (
    <>
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
      <div className="mt-10 grid grid-cols-2 gap-4">
        <button
          className={`${quizPageStyles.defaultActionButton}
            ${
              areAnswersChecked
                ? quizPageStyles.disabledActionButton
                : quizPageStyles.enabledActionButton
            }
            `}
          disabled={areAnswersChecked}
          onClick={handleCheckAnswersClick}>
          Check answers
        </button>
        <button
          className={`${quizPageStyles.defaultActionButton}
          ${
            areAnswersChecked
              ? quizPageStyles.enabledActionButton
              : quizPageStyles.disabledActionButton
          }
          `}
          disabled={!areAnswersChecked}
          onClick={handleNextQuestionClick}>
          Next question
        </button>
      </div>

      {/* ROUND STATUS */}
      {areAnswersChecked ? (
        <div>
          <p>{isRoundWon ? "YOU WON!" : "YOU LOST!"}</p>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
