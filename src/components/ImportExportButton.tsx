interface ImportExportButtonProps {
  onClick: () => void;
}

export function ImportExportButton({ onClick }: ImportExportButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 transition-all duration-200"
      title="Import/Export Questions"
    >
      <svg
        className="w-5 h-5 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    </button>
  );
}
