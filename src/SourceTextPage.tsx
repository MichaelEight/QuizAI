import { useState } from "react";
import { useNavigate } from "react-router";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const totalQuestions = settings.amountOfClosedQuestions + settings.amountOfOpenQuestions;
  const canGenerate = sourceText.trim().length > 0 && totalQuestions > 0;

  const handleGenerateButtonClick = async () => {
    if (!canGenerate) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateQuestions(sourceText, settings);

      if (!result || result.length === 0) {
        setError("No questions were generated. Please try with different text.");
        return;
      }

      setTasks(result);
      navigate("/quizPage");
    } catch (err) {
      setError("Failed to generate questions. Please check your API key and try again.");
      console.error("Error generating questions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Input Source Text</h1>
        <p className="text-slate-400">
          Paste the text you want to generate quiz questions from
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-black/20 p-6">
        {/* Textarea */}
        <div className="mb-4">
          <label htmlFor="sourceText" className="block text-sm font-medium text-slate-300 mb-2">
            Your Text
          </label>
          <textarea
            id="sourceText"
            className="w-full h-64 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            placeholder="Paste your text here... The AI will generate questions based on this content."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
          <div className="flex justify-between items-center mt-2 text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <span>{sourceText.length} characters</span>
              <span>{sourceText.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <button
              type="button"
              onClick={() => setSourceText("A little cat found a lost key in the yard. He wondered which door it might fit. After a while, he met an old mouse who had been looking for it for a long time. Together they opened a small box full of seeds.")}
              className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
            >
              Insert example text
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* Settings Summary */}
        <div className="mb-6 p-4 bg-slate-700/30 rounded-lg">
          <p className="text-sm text-slate-400">
            <span className="text-slate-300 font-medium">Will generate:</span>{" "}
            <span className="text-indigo-400">{settings.amountOfClosedQuestions}</span> closed +{" "}
            <span className="text-indigo-400">{settings.amountOfOpenQuestions}</span> open ={" "}
            <span className="text-slate-100 font-medium">{totalQuestions} questions</span>
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateButtonClick}
          disabled={!canGenerate || isLoading}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all duration-200 ${
            canGenerate && !isLoading
              ? "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.99]"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating Questions...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Questions
            </>
          )}
        </button>

        {/* Help Text */}
        {!canGenerate && !isLoading && (
          <p className="mt-4 text-center text-sm text-slate-500">
            {sourceText.trim().length === 0
              ? "Enter some text to generate questions"
              : "Configure at least one question in Settings"}
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Tips for better results:</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Use clear, factual text with specific information</li>
          <li>• Longer texts with more details produce better questions</li>
          <li>• Avoid overly complex or technical jargon</li>
        </ul>
      </div>
    </div>
  );
}
