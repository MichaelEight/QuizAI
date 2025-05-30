import React from "react";
import { generateQuestions } from "./backendService";
import { Task } from "./QuestionsTypes";
import { Settings } from "./SettingsType";
import { quizPageStyles } from "./PagesStyles";
import "./App.css";

// Props for SourceTextPage
type SourceTextProps = Readonly<{
  sourceText: string;
  setSourceText: React.Dispatch<React.SetStateAction<string>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  settings: Settings;
}>;

export default function SourceTextPage({
  sourceText,
  setSourceText,
  setTasks,
  settings,
}: SourceTextProps) {
  const handleGenerateButtonClick = async () => {
    // Make an API request
    const result = await generateQuestions(sourceText, settings);
    // Assign returned value to Tasks (setTasks)
    if (!result || result.length == 0) {
      console.error("No questions received!");
      return;
    }
    // Navigation to QuizPage can be handled via Router after generation (if desired)

    console.log("Questions generated successfully!");

    console.log("DEBUG:");
    console.log("settings:", settings);
    console.log("result:", result);

    setTasks(result);
  };

  return (
    <div className="card">
      <h2 className={quizPageStyles.pageHeader}>Generate Quiz</h2>
      <textarea
        className="w-full h-40 mt-4 bg-gray-800 text-gray-100 border border-gray-600 rounded-md focus:border-secondary focus:ring-2 focus:ring-secondary transition-all"
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}
        placeholder="Paste your source text here..."
      />
      <button
        className={`${quizPageStyles.defaultActionButton} mt-6 mx-auto block`}
        onClick={handleGenerateButtonClick}>
        Generate Questions
      </button>
    </div>
  );
}
