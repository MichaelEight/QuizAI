interface AiModelButtonProps {
  label: string;
  onClick: () => void;
}

// Sidebar/footer button that opens the global AI model chooser.
export function AiModelButton({ label, onClick }: AiModelButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Choose the global AI model (used for all AI features)"
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm"
    >
      <svg
        className="w-4 h-4 text-slate-400 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <rect x="7" y="7" width="10" height="10" rx="1.5" strokeWidth="1.8" />
        <path
          strokeLinecap="round"
          strokeWidth="1.8"
          d="M10 3v2m4-2v2m-4 14v2m4-2v2M3 10h2M3 14h2m14-4h2m-2 4h2"
        />
      </svg>
      <span className="text-slate-300 truncate">{label}</span>
    </button>
  );
}
