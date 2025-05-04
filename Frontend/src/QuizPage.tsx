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

  return (
    <>
      {/* title */}
      <h2 className="text-2xl font-bold">Quiz Page</h2>

      {/* Question */}
      {currentTask ? (
        <p>Q: {currentTask.question.value}</p>
      ) : (
        <p>No question loaded!</p>
      )}

      {/* Answers buttons */}
      {/* For each answer available, create a button */}
      {currentTask ? (
        currentTask.answers?.map((answer, index) => (
          <button className="bg-blue-500 hover:bg-blue-700" key={index}>
            {answer.value}
          </button>
        ))
      ) : (
        <p>No answers loaded!</p>
      )}

      {/* Action buttons */}
      <button disabled={areAnswersChecked} onClick={handleCheckAnswersClick}>
        Check answers
      </button>
      <button disabled={!areAnswersChecked} onClick={handleNextQuestionClick}>
        Next question
      </button>
    </>
  );
}
