import { SavedQuiz } from "../types/quizLibrary";
import { BaseModal } from "./BaseModal";
import { QuizLanguage } from "../SettingsType";

interface VersionPickerModalProps {
  quizzes: SavedQuiz[];
  onSelect: (quiz: SavedQuiz) => void;
  onClose: () => void;
}

export function VersionPickerModal({
  quizzes,
  onSelect,
  onClose,
}: VersionPickerModalProps) {
  const getLanguageLabel = (lang?: QuizLanguage): string => {
    const labels: Record<QuizLanguage, string> = {
      english: "🇬🇧 English",
      polish: "🇵🇱 Polski",
      spanish: "🇪🇸 Español",
      german: "🇩🇪 Deutsch",
    };
    return lang ? labels[lang] : "Unknown";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Sort: English first, then by newest
  const sortedQuizzes = [...quizzes].sort((a, b) => {
    if (a.language === "english" && b.language !== "english") return -1;
    if (a.language !== "english" && b.language === "english") return 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <BaseModal isOpen={true} onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4">
          Select Version
        </h2>

        <div className="space-y-2">
          {sortedQuizzes.map((quiz) => (
            <button
              key={quiz.id}
              onClick={() => onSelect(quiz)}
              className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-indigo-500/50 rounded-lg transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {getLanguageLabel(quiz.language)}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs font-medium">
                      v{quiz.version || 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>{quiz.totalQuestionCount} questions</span>
                    <span>•</span>
                    <span>Updated {formatDate(quiz.updatedAt)}</span>
                  </div>
                </div>

                <svg
                  className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
