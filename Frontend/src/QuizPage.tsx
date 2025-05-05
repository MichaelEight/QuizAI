import { useState } from "react";
import { Task } from "./QuestionsTypes";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
}

function createPool(tasks): Task[] {
  return shuffleArray(tasks);
}

function nextQuestion() {}

export default function QuizPage({
  tasks,
}: {
  readonly tasks: readonly Task[];
}) {
  const [currentTask, setCurrentTask] = useState<Task>();
  const [areAnswersChecked, setAreAnswersChecked] = useState<boolean>(false);

  // Assume we have tasks as Task[] in randomized order

  // From tasks select 1 task and display it
  // Add buttons: check answers, next question
  // Check answers: check if all have been selected correctly
  // Next question: activated after pressing check answers. Selects next task

  // we can actually create a pool with random tasks instead of modifying tasks

  const handleCheckAnswersClick = () => {
    // do something
    console.log("check answers pressed");
    setAreAnswersChecked(true);
  };

  const handleNextQuestionClick = () => {
    // do something
    // placeholder
    console.log("next question pressed");

    setCurrentTask(tasks[0]);
    setAreAnswersChecked(false);
  };

  const handleAnswerClick = (index: number) => {
    if (!currentTask?.answers) return;

    // Create a new copy of the answers array
    const updatedAnswers = currentTask.answers.map((answer, i) =>
      i === index ? { ...answer, isSelected: !answer.isSelected } : answer,
    );

    // Update the currentTask state with the new answers array
    setCurrentTask({ ...currentTask, answers: updatedAnswers });
  };

  const PAGE_HEADER_CLASSES = "mb-10 text-2xl font-bold";

  const QUESTION_HEADER_CLASSES = "font-bold text-2xl";

  const ANSWER_BUTTON_CLASSES =
    "border border-solid border-black flex flex-row items-center justify-center p-2";

  const DEFAULT_ACTION_BUTTON_CLASSES =
    "flex flex-row items-center justify-center p-2";

  const NOT_SELECTED_ANSWER_BUTTON_CLASSES =
    "bg-gray-200 hover:bg-gray-300 active:bg-gray-400";

  const SELECTED_ANSWER_BUTTON_CLASSES =
    "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700";

  const ENABLED_ACTION_BUTTON_CLASSES =
    "bg-green-500 hover:bg-green-600 active:bg-green-700";

  const DISABLED_ACTION_BUTTON_CLASSES =
    "bg-gray-300 hover:bg-gray-400 active:bg-gray-500 cursor-not-allowed";

  return (
    <>
      {/* title */}
      <h2 className={`${PAGE_HEADER_CLASSES}`}>Quiz Page</h2>

      {/* Question */}
      {currentTask ? (
        <p className={`${QUESTION_HEADER_CLASSES}`}>
          Q: {currentTask.question.value}
        </p>
      ) : (
        <p>No question loaded!</p>
      )}

      {/* Answers buttons */}
      {currentTask ? (
        <div className="grid grid-cols-2 gap-4">
          {currentTask.answers?.map((answer, index) => (
            <button
              key={index}
              className={`${ANSWER_BUTTON_CLASSES} ${answer.isSelected ? SELECTED_ANSWER_BUTTON_CLASSES : NOT_SELECTED_ANSWER_BUTTON_CLASSES}`}
              onClick={() => handleAnswerClick(index)}>
              {answer.value}
            </button>
          ))}
        </div>
      ) : (
        <p>No answers loaded!</p>
      )}

      {/* Action buttons */}
      <div className="mt-10 grid grid-cols-2 gap-4">
        <button
          className={`${DEFAULT_ACTION_BUTTON_CLASSES}
            ${
              areAnswersChecked
                ? DISABLED_ACTION_BUTTON_CLASSES
                : ENABLED_ACTION_BUTTON_CLASSES
            }
            `}
          disabled={areAnswersChecked}
          onClick={handleCheckAnswersClick}>
          Check answers
        </button>
        <button
          className={`${DEFAULT_ACTION_BUTTON_CLASSES}
          ${
            areAnswersChecked
              ? ENABLED_ACTION_BUTTON_CLASSES
              : DISABLED_ACTION_BUTTON_CLASSES
          }
          `}
          disabled={!areAnswersChecked}
          onClick={handleNextQuestionClick}>
          Next question
        </button>
      </div>
    </>
  );
}
