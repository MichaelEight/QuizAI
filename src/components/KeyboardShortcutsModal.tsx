import { BaseModal } from "./BaseModal";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "Space", action: "Check answer / Next question", context: "During quiz" },
  { key: "1-9", action: "Select answer option", context: "Multiple choice questions" },
  { key: "H", action: "Get hint", context: "Before checking answer" },
  { key: "S", action: "Show answer", context: "Before checking answer" },
  { key: "E", action: "Show explanation", context: "After checking answer" },
  { key: "Tab", action: "Toggle AI chat assistant", context: "Anytime" },
  { key: "Esc", action: "Close chat / Unfocus input", context: "Anytime" },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          Keyboard Shortcuts
        </h2>

        <div className="space-y-3">
          {SHORTCUTS.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">{shortcut.action}</p>
                <p className="text-xs text-slate-500">{shortcut.context}</p>
              </div>
              <kbd className="px-3 py-1.5 bg-slate-700 text-slate-200 rounded-lg border border-slate-600 font-mono text-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            💡 Tip: Most actions can be performed with just the Space bar and number keys
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors"
        >
          Got it!
        </button>
      </div>
    </BaseModal>
  );
}
