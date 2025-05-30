import React, { useState } from "react";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleGenerateButtonClick = async () => {
    setError(null);
    setIsSuccess(false);
    setIsLoading(true);
    try {
      const result = await generateQuestions(sourceText, settings);
      // Assign returned value to Tasks (setTasks)
      if (!result || result.length == 0) {
        throw new Error("No questions received from server.");
      }
      // Navigation to QuizPage can be handled via Router after generation (if desired)

      console.log("Questions generated successfully!");

      setTasks(result);
      setIsSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to generate questions.");
    } finally {
      setIsLoading(false);
    }
  };

  // Validation for text length
  const textLength = sourceText.length;
  const isValidLength = textLength >= 64 && textLength <= 25000;

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
        className={`${quizPageStyles.defaultActionButton} mt-6 mx-auto block ${!isValidLength || isLoading ? quizPageStyles.disabledActionButton : ""}`}
        onClick={handleGenerateButtonClick}
        disabled={!isValidLength || isLoading}>
        Generate Questions
      </button>
      {/* Feedback messages */}
      {!isLoading && !isValidLength && (
        <p className="text-yellow-400 text-center mt-2">
          {textLength < 64
            ? `Text too short (${textLength}/64 min)`
            : `Text too long (${textLength}/25000 max)`}
        </p>
      )}
      {isLoading && (
        <div className="flex justify-center mt-4">
          <div className="border-4 border-t-transparent border-purple-500 rounded-full w-8 h-8 animate-spin"></div>
        </div>
      )}
      {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      {isSuccess && (
        <>
          <p className="text-green-400 text-center mt-4">
            Questions generated successfully!
          </p>
          <button
            className={`${quizPageStyles.defaultActionButton} mt-4 mx-auto block`}
            onClick={() => navigate("/quizPage")}>
            Go to Quiz
          </button>
        </>
      )}
    </div>
  );
}
