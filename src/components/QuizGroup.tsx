import { useState, useMemo, useEffect } from "react";
import { SavedQuiz } from "../types/quizLibrary";
import { QuizLanguage } from "../SettingsType";

interface QuizGroupProps {
  quizzes: SavedQuiz[];
  onLoadQuiz: (quiz: SavedQuiz) => void;
  onEdit: (quiz: SavedQuiz) => void;
  onDuplicate: (quiz: SavedQuiz) => void;
  onTranslate: (quiz: SavedQuiz) => void;
  onViewSource: (quiz: SavedQuiz) => void;
  onRestoreBackup: (quiz: SavedQuiz) => void;
  onDelete: (quiz: SavedQuiz) => void;
  isDuplicating?: string | null;
  formatDate: (timestamp: number) => string;
  getLanguageLabel: (lang?: QuizLanguage) => string;
}

export function QuizGroup({
  quizzes,
  onLoadQuiz,
  onEdit,
  onDuplicate,
  onTranslate,
  onViewSource,
  onRestoreBackup,
  onDelete,
  isDuplicating,
  formatDate,
  getLanguageLabel,
}: QuizGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Select primary quiz: newest English version or newest overall
  const primaryQuiz = useMemo(() => {
    const englishVersions = quizzes.filter((q) => q.language === "english");
    if (englishVersions.length > 0) {
      return englishVersions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    }
    return quizzes.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }, [quizzes]);

  const otherQuizzes = useMemo(
    () => quizzes.filter((q) => q.id !== primaryQuiz.id),
    [quizzes, primaryQuiz.id]
  );

  if (!primaryQuiz) return null;

  const renderQuizRow = (quiz: SavedQuiz, isPrimary: boolean = false) => (
    <tr
      key={quiz.id}
      className={`hover:bg-slate-100 transition-colors ${!isPrimary ? "bg-slate-50" : ""}`}
    >
      <td className="px-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className={`font-medium ${isPrimary ? "text-slate-900" : "text-slate-600"}`}>
              {quiz.title}
            </p>
            {quiz.language && (
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded text-xs font-medium">
                {getLanguageLabel(quiz.language)}
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-medium">
              v{quiz.version || 1}
            </span>
            {quiz.previousVersionId && (
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-medium flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Backup
              </span>
            )}
            {isPrimary && quizzes.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
              >
                <span>{quizzes.length} versions</span>
                <svg
                  className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
          {quiz.description && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-1">
              {quiz.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-slate-500">
          {quiz.subjectName || quiz.subjectCode || "—"}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm">
          <div className="text-slate-900 font-medium">
            {quiz.totalQuestionCount}
          </div>
          <div className="text-slate-400 text-xs">
            {quiz.closedQuestionCount}c / {quiz.openQuestionCount}o
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-slate-500">{formatDate(quiz.createdAt)}</span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          {isPrimary && (
            <>
              {/* Primary Actions - Always Visible */}
              <button
                onClick={() => onLoadQuiz(quiz)}
                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Start Quiz"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onEdit(quiz)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                title="Edit"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(quiz)}
            className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
            title="Delete"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>

          {/* More Actions Menu */}
          {isPrimary && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === quiz.id ? null : quiz.id);
                }}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                title="More actions"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {openMenuId === quiz.id && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onDuplicate(quiz);
                        setOpenMenuId(null);
                      }}
                      disabled={isDuplicating === quiz.id}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-wait"
                    >
                      {isDuplicating === quiz.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        onTranslate(quiz);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Translate
                    </button>
                    <button
                      onClick={() => {
                        onViewSource(quiz);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Source
                    </button>
                    {quiz.previousVersionId && (
                      <button
                        onClick={() => {
                          onRestoreBackup(quiz);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-slate-100 hover:text-amber-700 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Restore Backup
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <>
      {renderQuizRow(primaryQuiz, true)}
      {isExpanded &&
        otherQuizzes.map((quiz) => renderQuizRow(quiz, false))}
    </>
  );
}
