import { useApiKey } from '../context/ApiKeyContext';

/**
 * First-run screen shown to users without an API key. Lets them either set up
 * AI features (opens the key modal) or continue using the app's offline
 * features. Shown once — the choice is remembered.
 */
export function AiWelcomeModal() {
  const { showWelcome, dismissWelcome, setShowApiKeyModal } = useApiKey();

  if (!showWelcome) return null;

  const handleSetupAi = () => {
    dismissWelcome();
    setShowApiKeyModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop — non-dismissable; the user must pick a path. */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl shadow-black/50 animate-fade-in">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Welcome to QuizAI</h2>
            <p className="text-sm text-slate-400">Choose how you want to start</p>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
            <p className="mb-2 text-sm font-semibold text-indigo-300">With API key</p>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>Generate quizzes from your text</li>
              <li>AI hints &amp; explanations</li>
              <li>Open-answer grading</li>
              <li>Ask the AI chat assistant</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-300">Without a key</p>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li>Take saved &amp; imported quizzes</li>
              <li>Multiple-choice questions</li>
              <li>Library, import &amp; export</li>
              <li>Stats &amp; achievements</li>
            </ul>
          </div>
        </div>

        <p className="mb-5 text-xs text-slate-500">
          Your API key is stored locally in your browser and only sent to OpenAI.
          You can add or change it anytime from the sidebar.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleSetupAi}
            className="flex-1 rounded-lg bg-indigo-500 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-indigo-400 active:scale-[0.98]"
          >
            Add API key
          </button>
          <button
            onClick={dismissWelcome}
            className="flex-1 rounded-lg bg-slate-700 px-4 py-3 font-medium text-slate-100 transition-all duration-200 hover:bg-slate-600 active:scale-[0.98]"
          >
            Continue without AI
          </button>
        </div>
      </div>
    </div>
  );
}
