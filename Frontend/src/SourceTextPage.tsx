import { Task, Question, Answer } from "./QuestionsTypes";

export default function SourceTextPage({
  sourceText,
  setSourceText,
  setTasks,
}) {
  const handleGenerateButtonClick = () => {
    // Make an API request
    // Assign returned value to Tasks (setTasks)
    // Go to QuizPage
    // Make a placeholder for now

    // Placeholder text
    setSourceText(
      "A cat found a shiny pebble in the garden. Curious, it batted the pebble across the yard. The pebble rolled into a hole, and a tiny mouse popped out, squeaking. Surprised but delighted, the cat and mouse became friends.",
    );

    const closedQuestion: Question = {
      value: "hello there?",
      isOpen: false,
    };

    const answer1: Answer = {
      value: "general kenobi",
      isCorrect: true,
    };

    const answer2: Answer = {
      value: "hi",
      isCorrect: false,
    };

    const answer3: Answer = {
      value: "hello",
      isCorrect: false,
    };

    const answer4: Answer = {
      value: "greetings",
      isCorrect: false,
    };

    const openQuestion: Question = {
      value: "What did the cat find in the garden?",
      isOpen: true,
    };

    const tasks: Task[] = [
      {
        question: closedQuestion,
        answers: [answer1, answer2, answer3, answer4],
      },
      {
        question: openQuestion,
      },
    ];

    setTasks(tasks);
  };

  return (
    <>
      <h2 className="text-2xl font-bold">Input source text</h2>
      <textarea
        className="border border-solid border-black"
        rows={5}
        cols={40}
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}
      />
      <button
        className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 p-2 rounded-xl"
        onClick={handleGenerateButtonClick}>
        Generate Questions
      </button>
    </>
  );
}
