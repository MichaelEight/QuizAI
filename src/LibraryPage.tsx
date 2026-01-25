import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuizLibrary } from "./context/QuizLibraryContext";
import { SavedQuiz, SortConfig, SortField, DatePreset, FilterConfig } from "./types/quizLibrary";
import { Task } from "./QuestionsTypes";
import { QuizLanguage } from "./SettingsType";
import { SourceTextModal } from "./components/SourceTextModal";
import { BaseModal } from "./components/BaseModal";
import { SuccessToast } from "./components/SuccessToast";
import { VersionPickerModal } from "./components/VersionPickerModal";

interface LibraryPageProps {
  setTasks: (tasks: Task[]) => void;
  setSourceText: (text: string) => void;
}

export default function LibraryPage({
  setTasks,
  setSourceText,
}: LibraryPageProps) {
  const navigate = useNavigate();
  const {
    quizzes,
    isLoading,
    error,
    deleteQuiz,
    duplicateQuiz,
    translateQuiz,
    getTranslations,
    getGroupMembers,
    updateQuiz,
    refreshQuizzes,
    restoreBackup,
    getFilteredQuizzes,
  } = useQuizLibrary();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Question count range
  const [questionCountMin, setQuestionCountMin] = useState<number | undefined>();
  const [questionCountMax, setQuestionCountMax] = useState<number | undefined>();

  // Date filters
  const [createdDatePreset, setCreatedDatePreset] = useState<DatePreset | null>(null);
  const [createdAfter, setCreatedAfter] = useState<number | undefined>();
  const [createdBefore, setCreatedBefore] = useState<number | undefined>();

  const [updatedDatePreset, setUpdatedDatePreset] = useState<DatePreset | null>(null);
  const [updatedAfter, setUpdatedAfter] = useState<number | undefined>();
  const [updatedBefore, setUpdatedBefore] = useState<number | undefined>();

  // Language filter
  const [languageFilter, setLanguageFilter] = useState<QuizLanguage | undefined>();

  // Question type filter
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'open' | 'closed' | 'all'>('all');

  // Teacher filter
  const [teacherFilter, setTeacherFilter] = useState<string | undefined>();

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "createdAt",
    direction: "desc",
  });

  // Edit modal state
  const [editingQuiz, setEditingQuiz] = useState<SavedQuiz | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTeacher, setEditTeacher] = useState("");
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editSubjectCode, setEditSubjectCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [deletingQuiz, setDeletingQuiz] = useState<SavedQuiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Translation modal state
  const [translatingQuiz, setTranslatingQuiz] = useState<SavedQuiz | null>(
    null,
  );
  const [targetLanguage, setTargetLanguage] = useState<QuizLanguage>("english");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Language version selector state
  const [showingVersionsFor, setShowingVersionsFor] =
    useState<SavedQuiz | null>(null);

  // Version picker state (for grouping)
  const [versionPickerGroup, setVersionPickerGroup] = useState<
    SavedQuiz[] | null
  >(null);

  // Source text modal state
  const [viewingSourceQuiz, setViewingSourceQuiz] =
    useState<SavedQuiz | null>(null);

  // Restore backup confirmation state
  const [restoringQuiz, setRestoringQuiz] = useState<SavedQuiz | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Success/Error notification state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loading states for operations
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null); // Store quiz ID being duplicated

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Get unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    quizzes.forEach((q) => {
      if (q.subjectName) subjects.add(q.subjectName);
    });
    return Array.from(subjects).sort();
  }, [quizzes]);

  // Get unique teachers for filter dropdown
  const uniqueTeachers = useMemo(() => {
    const teachers = new Set<string>();
    quizzes.forEach((q) => {
      if (q.teacher) teachers.add(q.teacher);
    });
    return Array.from(teachers).sort();
  }, [quizzes]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (subjectFilter) count++;
    if (questionCountMin !== undefined || questionCountMax !== undefined) count++;
    if (createdAfter || createdBefore) count++;
    if (updatedAfter || updatedBefore) count++;
    if (languageFilter) count++;
    if (questionTypeFilter !== 'all') count++;
    if (teacherFilter) count++;
    return count;
  }, [
    searchQuery, subjectFilter, questionCountMin, questionCountMax,
    createdAfter, createdBefore, updatedAfter, updatedBefore,
    languageFilter, questionTypeFilter, teacherFilter
  ]);

  // Handle created date preset selection
  const handleCreatedDatePreset = (preset: DatePreset) => {
    const now = Date.now();
    setCreatedDatePreset(preset);

    switch (preset) {
      case DatePreset.TODAY:
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        setCreatedAfter(todayStart.getTime());
        setCreatedBefore(undefined);
        break;
      case DatePreset.LAST_7_DAYS:
        setCreatedAfter(now - 7 * 24 * 60 * 60 * 1000);
        setCreatedBefore(undefined);
        break;
      case DatePreset.LAST_30_DAYS:
        setCreatedAfter(now - 30 * 24 * 60 * 60 * 1000);
        setCreatedBefore(undefined);
        break;
      case DatePreset.THIS_YEAR:
        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        setCreatedAfter(yearStart.getTime());
        setCreatedBefore(undefined);
        break;
      case DatePreset.CUSTOM:
        break;
    }
  };

  // Handle updated date preset selection
  const handleUpdatedDatePreset = (preset: DatePreset) => {
    const now = Date.now();
    setUpdatedDatePreset(preset);

    switch (preset) {
      case DatePreset.TODAY:
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        setUpdatedAfter(todayStart.getTime());
        setUpdatedBefore(undefined);
        break;
      case DatePreset.LAST_7_DAYS:
        setUpdatedAfter(now - 7 * 24 * 60 * 60 * 1000);
        setUpdatedBefore(undefined);
        break;
      case DatePreset.LAST_30_DAYS:
        setUpdatedAfter(now - 30 * 24 * 60 * 60 * 1000);
        setUpdatedBefore(undefined);
        break;
      case DatePreset.THIS_YEAR:
        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        setUpdatedAfter(yearStart.getTime());
        setUpdatedBefore(undefined);
        break;
      case DatePreset.CUSTOM:
        break;
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSubjectFilter("");
    setQuestionCountMin(undefined);
    setQuestionCountMax(undefined);
    setCreatedDatePreset(null);
    setCreatedAfter(undefined);
    setCreatedBefore(undefined);
    setUpdatedDatePreset(null);
    setUpdatedAfter(undefined);
    setUpdatedBefore(undefined);
    setLanguageFilter(undefined);
    setQuestionTypeFilter('all');
    setTeacherFilter(undefined);
  };

  // Filter and sort quizzes using context's getFilteredQuizzes
  const filteredQuizzes = useMemo(() => {
    const filterConfig: FilterConfig = {
      searchQuery,
      subjectName: subjectFilter || undefined,
      questionCountMin,
      questionCountMax,
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore,
      language: languageFilter,
      questionType: questionTypeFilter,
      teacher: teacherFilter,
    };

    return getFilteredQuizzes(filterConfig, sortConfig);
  }, [
    searchQuery, subjectFilter, questionCountMin, questionCountMax,
    createdAfter, createdBefore, updatedAfter, updatedBefore,
    languageFilter, questionTypeFilter, teacherFilter,
    sortConfig, getFilteredQuizzes
  ]);

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

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return (
        <svg
          className="w-4 h-4 text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortConfig.direction === "asc" ? (
      <svg
        className="w-4 h-4 text-indigo-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-indigo-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  const handleLoadQuiz = (quiz: SavedQuiz) => {
    const groupMembers = getGroupMembers(quiz.id);

    // If multiple versions exist, show version picker
    if (groupMembers.length > 1) {
      setVersionPickerGroup(groupMembers);
    } else {
      // Load directly
      loadQuizDirectly(quiz);
    }
  };

  const loadQuizDirectly = (quiz: SavedQuiz) => {
    setTasks(quiz.tasks);
    setSourceText(quiz.sourceText);
    navigate("/quizPage", {
      state: {
        loadedQuizId: quiz.id,
        loadedQuizVersion: quiz.version || 1,
      },
    });
  };

  const handleEditClick = (quiz: SavedQuiz) => {
    setEditingQuiz(quiz);
    setEditTitle(quiz.title);
    setEditDescription(quiz.description || "");
    setEditTeacher(quiz.teacher || "");
    setEditSubjectName(quiz.subjectName || "");
    setEditSubjectCode(quiz.subjectCode || "");
  };

  const handleSaveEdit = async () => {
    if (!editingQuiz || !editTitle.trim()) return;

    setIsSaving(true);
    try {
      await updateQuiz(editingQuiz.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        teacher: editTeacher.trim() || undefined,
        subjectName: editSubjectName.trim() || undefined,
        subjectCode: editSubjectCode.trim() || undefined,
      });
      setSuccessMessage(`Updated "${editTitle.trim()}"`);
      setEditingQuiz(null);
    } catch (err) {
      console.error("Failed to update quiz:", err);
      setErrorMessage("Failed to update quiz. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingQuiz) return;

    setIsDeleting(true);
    try {
      await deleteQuiz(deletingQuiz.id);
      setSuccessMessage(`Deleted "${deletingQuiz.title}"`);
      setDeletingQuiz(null);
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      setErrorMessage("Failed to delete quiz. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (quiz: SavedQuiz) => {
    setIsDuplicating(quiz.id);
    try {
      await duplicateQuiz(quiz.id);
      setSuccessMessage(`Created duplicate of "${quiz.title}"`);
    } catch (err) {
      console.error("Failed to duplicate quiz:", err);
      setErrorMessage("Failed to duplicate quiz. Please try again.");
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleTranslateClick = (quiz: SavedQuiz) => {
    setTranslatingQuiz(quiz);
    setTargetLanguage("english");
    setTranslationError(null);
  };

  const handleTranslateConfirm = async () => {
    if (!translatingQuiz) return;

    // Check if translation already exists
    const existingTranslations = getTranslations(translatingQuiz.id);
    const alreadyExists = existingTranslations.some(
      (q) => q.language === targetLanguage,
    );
    if (alreadyExists) {
      setTranslationError(`A ${targetLanguage} version already exists.`);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);
    try {
      await translateQuiz(translatingQuiz.id, targetLanguage);
      setSuccessMessage(
        `Created ${targetLanguage} translation of "${translatingQuiz.title}"`,
      );
      setTranslatingQuiz(null);
    } catch (err) {
      console.error("Failed to translate quiz:", err);
      setTranslationError(
        "Translation failed. Please check your API key and try again.",
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRestoreBackup = (quiz: SavedQuiz) => {
    if (!quiz.previousVersionId) return;
    setRestoringQuiz(quiz);
  };

  const confirmRestoreBackup = async () => {
    if (!restoringQuiz) return;

    setIsRestoring(true);
    try {
      await restoreBackup(restoringQuiz.id);
      setSuccessMessage(`Restored previous version of "${restoringQuiz.title}"`);
      setRestoringQuiz(null);
    } catch (err) {
      console.error("Failed to restore backup:", err);
      setErrorMessage("Failed to restore previous version. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  const getLanguageLabel = (lang?: QuizLanguage): string => {
    const labels: Record<QuizLanguage, string> = {
      english: "🇬🇧 EN",
      polish: "🇵🇱 PL",
      spanish: "🇪🇸 ES",
      german: "🇩🇪 DE",
    };
    return lang ? labels[lang] : "";
  };

  const getLanguageFullName = (lang: QuizLanguage): string => {
    const names: Record<QuizLanguage, string> = {
      english: "English",
      polish: "Polski",
      spanish: "Español",
      german: "Deutsch",
    };
    return names[lang];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
          <span>Loading library...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
        <p className="text-rose-400 mb-4">{error}</p>
        <button
          onClick={refreshQuizzes}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Quiz Library
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            {quizzes.length === 0
              ? "No saved quizzes yet"
              : `${quizzes.length} quiz${quizzes.length === 1 ? "" : "zes"} saved`}
          </p>
        </div>
        <button
          onClick={() => navigate("/sourcePage")}
          className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create New Quiz
        </button>
      </div>

      {/* Empty State */}
      {quizzes.length === 0 ? (
        <div className="p-12 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">
            Your library is empty
          </h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Create your first quiz by entering source text and generating
            questions. You can save quizzes to access them later.
          </p>
          <button
            onClick={() => navigate("/sourcePage")}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors">
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Always visible: Search + Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search quizzes..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-500 text-white rounded-full text-xs font-medium">
                    {activeFilterCount}
                  </span>
                )}
                <svg className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Collapsible Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Subject Filter */}
                  {uniqueSubjects.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">
                        Subject
                      </label>
                      <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50">
                        <option value="">All Subjects</option>
                        {uniqueSubjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Teacher Filter */}
                  {uniqueTeachers.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">
                        Teacher
                      </label>
                      <select
                        value={teacherFilter || ""}
                        onChange={(e) => setTeacherFilter(e.target.value || undefined)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50">
                        <option value="">All Teachers</option>
                        {uniqueTeachers.map((teacher) => (
                          <option key={teacher} value={teacher}>
                            {teacher}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Language Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Language
                    </label>
                    <select
                      value={languageFilter || ""}
                      onChange={(e) => setLanguageFilter(e.target.value as QuizLanguage || undefined)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50">
                      <option value="">All Languages</option>
                      <option value="english">🇬🇧 English</option>
                      <option value="polish">🇵🇱 Polski</option>
                      <option value="spanish">🇪🇸 Español</option>
                      <option value="german">🇩🇪 Deutsch</option>
                    </select>
                  </div>

                  {/* Question Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Question Type
                    </label>
                    <select
                      value={questionTypeFilter}
                      onChange={(e) => setQuestionTypeFilter(e.target.value as 'open' | 'closed' | 'all')}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50">
                      <option value="all">All Types</option>
                      <option value="open">Open Questions</option>
                      <option value="closed">Closed Questions</option>
                    </select>
                  </div>

                  {/* Question Count Range */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Question Count
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={questionCountMin ?? ""}
                        onChange={(e) => setQuestionCountMin(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Min"
                        min="0"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                      />
                      <span className="text-slate-500">—</span>
                      <input
                        type="number"
                        value={questionCountMax ?? ""}
                        onChange={(e) => setQuestionCountMax(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Max"
                        min="0"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Filters Section */}
                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Date Filters</h4>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Created Date */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">
                        Created Date
                      </label>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          onClick={() => handleCreatedDatePreset(DatePreset.TODAY)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            createdDatePreset === DatePreset.TODAY
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          Today
                        </button>
                        <button
                          onClick={() => handleCreatedDatePreset(DatePreset.LAST_7_DAYS)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            createdDatePreset === DatePreset.LAST_7_DAYS
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          Last 7 Days
                        </button>
                        <button
                          onClick={() => handleCreatedDatePreset(DatePreset.LAST_30_DAYS)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            createdDatePreset === DatePreset.LAST_30_DAYS
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          Last 30 Days
                        </button>
                        <button
                          onClick={() => handleCreatedDatePreset(DatePreset.THIS_YEAR)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            createdDatePreset === DatePreset.THIS_YEAR
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          This Year
                        </button>
                        <button
                          onClick={() => handleCreatedDatePreset(DatePreset.CUSTOM)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            createdDatePreset === DatePreset.CUSTOM
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          Custom
                        </button>
                      </div>

                      {/* Custom Date Pickers */}
                      {createdDatePreset === DatePreset.CUSTOM && (
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={createdAfter ? new Date(createdAfter).toISOString().split('T')[0] : ''}
                            onChange={(e) => setCreatedAfter(e.target.value ? new Date(e.target.value).getTime() : undefined)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                            placeholder="From"
                          />
                          <input
                            type="date"
                            value={createdBefore ? new Date(createdBefore).toISOString().split('T')[0] : ''}
                            onChange={(e) => setCreatedBefore(e.target.value ? new Date(e.target.value).getTime() : undefined)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                            placeholder="To"
                          />
                        </div>
                      )}
                    </div>

                    {/* Updated Date */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">
                        Updated Date
                      </label>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          onClick={() => handleUpdatedDatePreset(DatePreset.TODAY)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            updatedDatePreset === DatePreset.TODAY
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          Today
                        </button>
                        <button
                          onClick={() => handleUpdatedDatePreset(DatePreset.LAST_7_DAYS)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            updatedDatePreset === DatePreset.LAST_7_DAYS
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          Last 7 Days
                        </button>
                        <button
                          onClick={() => handleUpdatedDatePreset(DatePreset.LAST_30_DAYS)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            updatedDatePreset === DatePreset.LAST_30_DAYS
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          Last 30 Days
                        </button>
                        <button
                          onClick={() => handleUpdatedDatePreset(DatePreset.THIS_YEAR)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            updatedDatePreset === DatePreset.THIS_YEAR
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          This Year
                        </button>
                        <button
                          onClick={() => handleUpdatedDatePreset(DatePreset.CUSTOM)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            updatedDatePreset === DatePreset.CUSTOM
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          Custom
                        </button>
                      </div>

                      {/* Custom Date Pickers */}
                      {updatedDatePreset === DatePreset.CUSTOM && (
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={updatedAfter ? new Date(updatedAfter).toISOString().split('T')[0] : ''}
                            onChange={(e) => setUpdatedAfter(e.target.value ? new Date(e.target.value).getTime() : undefined)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                            placeholder="From"
                          />
                          <input
                            type="date"
                            value={updatedBefore ? new Date(updatedBefore).toISOString().split('T')[0] : ''}
                            onChange={(e) => setUpdatedBefore(e.target.value ? new Date(e.target.value).getTime() : undefined)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                            placeholder="To"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="pt-4 border-t border-slate-700 flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    disabled={activeFilterCount === 0}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-200 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          {activeFilterCount > 0 && (
            <p className="text-sm text-slate-500">
              Showing {filteredQuizzes.length} of {quizzes.length} quizzes
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          )}

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredQuizzes.length === 0 ? (
              <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl text-center text-slate-500">
                No quizzes match your search
              </div>
            ) : (
              filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
                  {/* Title and description */}
                  <div>
                    <h3 className="font-medium text-slate-100">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata row */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {quiz.language && (
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs font-medium">
                        {getLanguageLabel(quiz.language)}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs font-medium">
                      v{quiz.version || 1}
                    </span>
                    {(quiz.subjectName || quiz.subjectCode) && (
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-slate-300 text-xs">
                        {quiz.subjectName || quiz.subjectCode}
                      </span>
                    )}
                    <span className="text-slate-400">
                      {quiz.totalQuestionCount} questions
                    </span>
                    <span className="text-slate-500">
                      Updated {formatDate(quiz.updatedAt)}
                    </span>
                    {getTranslations(quiz.id).length > 1 && (
                      <button
                        onClick={() => setShowingVersionsFor(quiz)}
                        className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-medium hover:bg-purple-500/30 transition-colors">
                        {getTranslations(quiz.id).length} versions
                      </button>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                    <button
                      onClick={() => handleLoadQuiz(quiz)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors font-medium">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
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
                      Start
                    </button>
                    <button
                      onClick={() => handleEditClick(quiz)}
                      className="p-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-600/50 rounded-lg transition-colors"
                      title="Edit"
                      aria-label={`Edit ${quiz.title}`}>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDuplicate(quiz)}
                      disabled={isDuplicating === quiz.id}
                      className="p-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
                      title="Duplicate"
                      aria-label={`Duplicate ${quiz.title}`}>
                      {isDuplicating === quiz.id ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleTranslateClick(quiz)}
                      className="p-2.5 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                      title="Translate"
                      aria-label={`Translate ${quiz.title} to another language`}>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewingSourceQuiz(quiz)}
                      className="p-2.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="View Source Text"
                      aria-label={`View source text for ${quiz.title}`}>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </button>
                    {quiz.previousVersionId && (
                      <button
                        onClick={() => handleRestoreBackup(quiz)}
                        className="p-2.5 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
                        title="Restore Backup"
                        aria-label={`Restore previous version of ${quiz.title}`}>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => setDeletingQuiz(quiz)}
                      className="p-2.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="Delete"
                      aria-label={`Delete ${quiz.title}`}>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-700">
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort("title")}
                        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors">
                        Title
                        {getSortIcon("title")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-sm font-medium text-slate-300">
                        Subject
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort("totalQuestionCount")}
                        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors">
                        Questions
                        {getSortIcon("totalQuestionCount")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort("createdAt")}
                        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors">
                        Created
                        {getSortIcon("createdAt")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort("updatedAt")}
                        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors">
                        Updated
                        {getSortIcon("updatedAt")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-slate-300">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredQuizzes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500">
                        No quizzes match your search
                      </td>
                    </tr>
                  ) : (
                    filteredQuizzes.map((quiz) => (
                      <tr
                        key={quiz.id}
                        className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-100">
                                {quiz.title}
                              </p>
                              {quiz.language && (
                                <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs font-medium">
                                  {getLanguageLabel(quiz.language)}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs font-medium">
                                v{quiz.version || 1}
                              </span>
                              {getTranslations(quiz.id).length > 1 && (
                                <button
                                  onClick={() => setShowingVersionsFor(quiz)}
                                  className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-medium hover:bg-purple-500/30 transition-colors">
                                  {getTranslations(quiz.id).length} versions
                                </button>
                              )}
                            </div>
                            {quiz.description && (
                              <p className="text-sm text-slate-500 truncate max-w-xs">
                                {quiz.description}
                              </p>
                            )}
                            {quiz.teacher && (
                              <p className="text-xs text-slate-600 mt-0.5">
                                by {quiz.teacher}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {quiz.subjectName || quiz.subjectCode ? (
                            <div className="flex items-center gap-2">
                              {quiz.subjectName && (
                                <span className="text-sm text-slate-300">
                                  {quiz.subjectName}
                                </span>
                              )}
                              {quiz.subjectCode && (
                                <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                                  {quiz.subjectCode}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <div className="text-slate-100 font-medium">
                              {quiz.totalQuestionCount}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {quiz.closedQuestionCount}c / {quiz.openQuestionCount}o
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-400">
                            {formatDate(quiz.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-400">
                            {formatDate(quiz.updatedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Primary Actions - Always Visible */}
                            <button
                              onClick={() => handleLoadQuiz(quiz)}
                              className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                              title="Start Quiz">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
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
                              onClick={() => handleEditClick(quiz)}
                              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-600/50 rounded-lg transition-colors"
                              title="Edit">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingQuiz(quiz)}
                              className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                              title="Delete">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>

                            {/* More Actions Menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === quiz.id ? null : quiz.id);
                                }}
                                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-600/50 rounded-lg transition-colors"
                                title="More actions">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor">
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
                                  className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
                                  onClick={(e) => e.stopPropagation()}>
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        handleDuplicate(quiz);
                                        setOpenMenuId(null);
                                      }}
                                      disabled={isDuplicating === quiz.id}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-wait">
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
                                        handleTranslateClick(quiz);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors flex items-center gap-3">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                      </svg>
                                      Translate
                                    </button>
                                    <button
                                      onClick={() => {
                                        setViewingSourceQuiz(quiz);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors flex items-center gap-3">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      View Source
                                    </button>
                                    {quiz.previousVersionId && (
                                      <button
                                        onClick={() => {
                                          handleRestoreBackup(quiz);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-slate-700 hover:text-amber-300 transition-colors flex items-center gap-3">
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
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      <BaseModal
        isOpen={!!editingQuiz}
        onClose={() => setEditingQuiz(null)}
        maxWidth="max-w-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-6">
            Edit Quiz Metadata
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-title"
                className="block text-sm font-medium text-slate-300 mb-1.5">
                Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="edit-subject"
                  className="block text-sm font-medium text-slate-300 mb-1.5">
                  Subject
                </label>
                <input
                  id="edit-subject"
                  type="text"
                  value={editSubjectName}
                  onChange={(e) => setEditSubjectName(e.target.value)}
                  placeholder="e.g., Biology"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-code"
                  className="block text-sm font-medium text-slate-300 mb-1.5">
                  Code
                </label>
                <input
                  id="edit-code"
                  type="text"
                  value={editSubjectCode}
                  onChange={(e) => setEditSubjectCode(e.target.value)}
                  placeholder="CS101"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-teacher"
                className="block text-sm font-medium text-slate-300 mb-1.5">
                Teacher
              </label>
              <input
                id="edit-teacher"
                type="text"
                value={editTeacher}
                onChange={(e) => setEditTeacher(e.target.value)}
                placeholder="Teacher or professor name"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingQuiz(null)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving || !editTitle.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* Delete Confirmation Modal */}
      <BaseModal
        isOpen={!!deletingQuiz}
        onClose={() => setDeletingQuiz(null)}
        maxWidth="max-w-md">
        <div className="p-6">
          <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-100 text-center mb-2">
            Delete Quiz?
          </h2>
          <p className="text-slate-400 text-center mb-6">
            Are you sure you want to delete "{deletingQuiz?.title}"? This action
            cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setDeletingQuiz(null)}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors">
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Translation Modal */}
      <BaseModal
        isOpen={!!translatingQuiz}
        onClose={() => !isTranslating && setTranslatingQuiz(null)}
        maxWidth="max-w-md">
        <div className="p-6">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-100 text-center mb-2">
            Translate Quiz
          </h2>
          <p className="text-slate-400 text-center mb-4">
            Create a translated version of "{translatingQuiz?.title}"
          </p>

          {translationError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center">
              {translationError}
            </div>
          )}

          <fieldset className="mb-6">
            <legend className="block text-sm font-medium text-slate-300 mb-2">
              Target Language
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                ["english", "polish", "spanish", "german"] as QuizLanguage[]
              ).map((lang) => {
                const existingTranslations = translatingQuiz
                  ? getTranslations(translatingQuiz.id)
                  : [];
                const alreadyExists = existingTranslations.some(
                  (q) => q.language === lang,
                );
                const isCurrentLang = translatingQuiz?.language === lang;
                const isSelected = targetLanguage === lang;
                const isDisabled = alreadyExists || isCurrentLang;

                const buttonClass = isSelected
                  ? "bg-indigo-500/30 border-2 border-indigo-500 text-indigo-100"
                  : isDisabled
                    ? "bg-slate-700/30 border-2 border-transparent text-slate-500 cursor-not-allowed"
                    : "bg-slate-700/50 border-2 border-transparent text-slate-300 hover:bg-slate-700";

                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTargetLanguage(lang)}
                    disabled={isDisabled}
                    className={`p-3 rounded-lg text-left transition-colors ${buttonClass}`}>
                    <span className="font-medium">
                      {getLanguageFullName(lang)}
                    </span>
                    {(alreadyExists || isCurrentLang) && (
                      <span className="block text-xs mt-0.5 text-slate-500">
                        {isCurrentLang ? "Current" : "Exists"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex gap-3">
            <button
              onClick={() => setTranslatingQuiz(null)}
              disabled={isTranslating}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleTranslateConfirm}
              disabled={isTranslating}
              className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {isTranslating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                  Translating...
                </>
              ) : (
                "Translate"
              )}
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Language Versions Modal */}
      <BaseModal
        isOpen={!!showingVersionsFor}
        onClose={() => setShowingVersionsFor(null)}
        maxWidth="max-w-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">
            Language Versions
          </h2>

          <p className="text-slate-400 text-sm mb-4">
            Select a language version to load:
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {showingVersionsFor &&
              getTranslations(showingVersionsFor.id).map((version) => (
                <button
                  key={version.id}
                  onClick={() => {
                    handleLoadQuiz(version);
                    setShowingVersionsFor(null);
                  }}
                  className="w-full p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-100">
                          {version.title}
                        </span>
                        {version.language && (
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs font-medium">
                            {getLanguageLabel(version.language)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {version.totalQuestionCount} questions •{" "}
                        {formatDate(version.createdAt)}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
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
                  </div>
                </button>
              ))}
          </div>

          {showingVersionsFor && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <button
                onClick={() => {
                  handleTranslateClick(showingVersionsFor);
                  setShowingVersionsFor(null);
                }}
                className="w-full px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Translation
              </button>
            </div>
          )}
        </div>
      </BaseModal>

      {/* Source Text Modal */}
      {viewingSourceQuiz && (
        <SourceTextModal
          isOpen={!!viewingSourceQuiz}
          onClose={() => setViewingSourceQuiz(null)}
          sourceText={viewingSourceQuiz.sourceText}
          quizTitle={viewingSourceQuiz.title}
        />
      )}

      {/* Restore Backup Confirmation Modal */}
      <BaseModal
        isOpen={!!restoringQuiz}
        onClose={() => setRestoringQuiz(null)}
        maxWidth="max-w-lg">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">
                Restore Previous Version?
              </h2>
              <p className="text-sm text-slate-400">
                This will swap versions
              </p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-300 mb-3">
              Current version (v{restoringQuiz?.version || 1}) will become the
              backup, and the previous version will be restored.
            </p>
            <p className="text-xs text-slate-500">
              You can always swap back if needed.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setRestoringQuiz(null)}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={confirmRestoreBackup}
              disabled={isRestoring}
              className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors">
              {isRestoring ? "Restoring..." : "Restore"}
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Version Picker Modal */}
      {versionPickerGroup && (
        <VersionPickerModal
          quizzes={versionPickerGroup}
          onSelect={(quiz) => {
            setVersionPickerGroup(null);
            loadQuizDirectly(quiz);
          }}
          onClose={() => setVersionPickerGroup(null)}
        />
      )}

      {/* Success Toast */}
      <SuccessToast
        message={successMessage}
        onDismiss={() => setSuccessMessage(null)}
      />

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-rose-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-2 text-white/80 hover:text-white transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
