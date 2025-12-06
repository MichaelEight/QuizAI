import { generateQuestions } from "./backendService";
import { Task } from "./QuestionsTypes";
import { Settings } from "./SettingsType";

interface SourceTextPageProps {
  sourceText: string;
  setSourceText: (text: string) => void;
  setTasks: (tasks: Task[]) => void;
  settings: Settings;
}

export default function SourceTextPage({
  sourceText,
  setSourceText,
  setTasks,
  settings,
}: SourceTextPageProps) {
  const handleGenerateButtonClick = async () => {
    // Make an API request
    const result = await generateQuestions(sourceText, settings);
    // Assign returned value to Tasks (setTasks)
    if (!result || result.length == 0) {
      console.error("No questions received!");
      return;
    }
    // TODO: Go to QuizPage

    console.log("Questions generated successfully!");

    console.log("DEBUG:");
    console.log("settings:", settings);
    console.log("result:", result);

    setTasks(result);
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
