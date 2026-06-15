import { useApiKey } from '../context/ApiKeyContext';

interface AiLockedProps {
  /** Headline, e.g. "AI required to generate questions". */
  readonly title: string;
  /** Optional supporting line. */
  readonly message?: string;
  /** Visual density. "card" = bordered block, "inline" = compact row. */
  readonly variant?: 'card' | 'inline';
  readonly className?: string;
}

function LockIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

/**
 * Locked-feature placeholder shown wherever an AI feature is unavailable
 * because no OpenAI API key is configured. Offers a one-tap path to add one.
 */
export function AiLocked({
  title,
  message,
  variant = 'card',
  className = '',
}: AiLockedProps) {
  const { setShowApiKeyModal } = useApiKey();

  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 ${className}`}
      >
        <LockIcon className="h-4 w-4 flex-shrink-0 text-indigo-400" />
        <span className="flex-1 text-sm text-slate-300">{title}</span>
        <button
          onClick={() => setShowApiKeyModal(true)}
          className="flex-shrink-0 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-400"
        >
          Add API Key
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 px-6 py-8 text-center ${className}`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20">
        <LockIcon className="h-6 w-6 text-indigo-400" />
      </div>
      <p className="mb-1 font-medium text-slate-100">{title}</p>
      {message && <p className="mb-4 max-w-sm text-sm text-slate-400">{message}</p>}
      <button
        onClick={() => setShowApiKeyModal(true)}
        className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-400 active:scale-[0.98]"
      >
        Add API Key
      </button>
    </div>
  );
}
