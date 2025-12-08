import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQuizLibrary } from './context/QuizLibraryContext';
import { SavedQuiz, SortConfig, SortField } from './types/quizLibrary';
import { Task } from './QuestionsTypes';

interface LibraryPageProps {
  setTasks: (tasks: Task[]) => void;
  setSourceText: (text: string) => void;
}

export default function LibraryPage({ setTasks, setSourceText }: LibraryPageProps) {
  const navigate = useNavigate();
  const { quizzes, isLoading, error, deleteQuiz, duplicateQuiz, updateQuiz, refreshQuizzes } = useQuizLibrary();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc',
  });

  // Edit modal state
  const [editingQuiz, setEditingQuiz] = useState<SavedQuiz | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectCode, setEditSubjectCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [deletingQuiz, setDeletingQuiz] = useState<SavedQuiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    quizzes.forEach(q => {
      if (q.subjectName) subjects.add(q.subjectName);
    });
    return Array.from(subjects).sort();
  }, [quizzes]);

  // Filter and sort quizzes
  const filteredQuizzes = useMemo(() => {
    let result = [...quizzes];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q =>
        q.title.toLowerCase().includes(query) ||
        q.description?.toLowerCase().includes(query) ||
        q.subjectName?.toLowerCase().includes(query) ||
        q.subjectCode?.toLowerCase().includes(query) ||
        q.teacher?.toLowerCase().includes(query)
      );
    }

    // Apply subject filter
    if (subjectFilter) {
      result = result.filter(q => q.subjectName === subjectFilter);
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'updatedAt':
          comparison = a.updatedAt - b.updatedAt;
          break;
        case 'totalQuestionCount':
          comparison = a.totalQuestionCount - b.totalQuestionCount;
          break;
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [quizzes, searchQuery, subjectFilter, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return (
        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const handleLoadQuiz = (quiz: SavedQuiz) => {
    setTasks(quiz.tasks);
    setSourceText(quiz.sourceText);
    navigate('/quizPage');
  };

  const handleEditClick = (quiz: SavedQuiz) => {
    setEditingQuiz(quiz);
    setEditTitle(quiz.title);
    setEditDescription(quiz.description || '');
    setEditTeacher(quiz.teacher || '');
    setEditSubjectName(quiz.subjectName || '');
    setEditSubjectCode(quiz.subjectCode || '');
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
      setEditingQuiz(null);
    } catch (err) {
      console.error('Failed to update quiz:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingQuiz) return;

    setIsDeleting(true);
    try {
      await deleteQuiz(deletingQuiz.id);
      setDeletingQuiz(null);
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (quiz: SavedQuiz) => {
    try {
      await duplicateQuiz(quiz.id);
    } catch (err) {
      console.error('Failed to duplicate quiz:', err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
        >
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Quiz Library</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            {quizzes.length === 0
              ? 'No saved quizzes yet'
              : `${quizzes.length} quiz${quizzes.length === 1 ? '' : 'zes'} saved`}
          </p>
        </div>
        <button
          onClick={() => navigate('/sourcePage')}
          className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Quiz
        </button>
      </div>

      {/* Empty State */}
      {quizzes.length === 0 ? (
        <div className="p-12 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Your library is empty</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Create your first quiz by entering source text and generating questions. You can save quizzes to access them later.
          </p>
          <button
            onClick={() => navigate('/sourcePage')}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
          >
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quizzes..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>
            {uniqueSubjects.length > 0 && (
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              >
                <option value="">All Subjects</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            )}
          </div>

          {/* Results count */}
          {(searchQuery || subjectFilter) && (
            <p className="text-sm text-slate-500">
              Showing {filteredQuizzes.length} of {quizzes.length} quizzes
              {searchQuery && ` matching "${searchQuery}"`}
              {subjectFilter && ` in ${subjectFilter}`}
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
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3"
                >
                  {/* Title and description */}
                  <div>
                    <h3 className="font-medium text-slate-100">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{quiz.description}</p>
                    )}
                  </div>

                  {/* Metadata row */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {(quiz.subjectName || quiz.subjectCode) && (
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-slate-300 text-xs">
                        {quiz.subjectName || quiz.subjectCode}
                      </span>
                    )}
                    <span className="text-slate-400">
                      {quiz.totalQuestionCount} questions
                    </span>
                    <span className="text-slate-500">
                      {formatDate(quiz.createdAt)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                    <button
                      onClick={() => handleLoadQuiz(quiz)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start
                    </button>
                    <button
                      onClick={() => handleEditClick(quiz)}
                      className="p-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-600/50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDuplicate(quiz)}
                      className="p-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-600/50 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingQuiz(quiz)}
                      className="p-2.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        Title
                        {getSortIcon('title')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-sm font-medium text-slate-300">Subject</span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('totalQuestionCount')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        Questions
                        {getSortIcon('totalQuestionCount')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        Created
                        {getSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-slate-300">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredQuizzes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No quizzes match your search
                      </td>
                    </tr>
                  ) : (
                    filteredQuizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-slate-100">{quiz.title}</p>
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
                                <span className="text-sm text-slate-300">{quiz.subjectName}</span>
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
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-100 font-medium">{quiz.totalQuestionCount}</span>
                            <span className="text-slate-500">
                              ({quiz.closedQuestionCount}c / {quiz.openQuestionCount}o)
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-400">
                            {formatDate(quiz.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleLoadQuiz(quiz)}
                              className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                              title="Load Quiz"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditClick(quiz)}
                              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-600/50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDuplicate(quiz)}
                              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-600/50 rounded-lg transition-colors"
                              title="Duplicate"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingQuiz(quiz)}
                              className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
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
      {editingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingQuiz(null)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <button
              onClick={() => setEditingQuiz(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-slate-100 mb-6">Edit Quiz Metadata</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={editSubjectName}
                    onChange={(e) => setEditSubjectName(e.target.value)}
                    placeholder="e.g., Biology"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Code
                  </label>
                  <input
                    type="text"
                    value={editSubjectCode}
                    onChange={(e) => setEditSubjectCode(e.target.value)}
                    placeholder="CS101"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Teacher
                </label>
                <input
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
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editTitle.trim()}
                  className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeletingQuiz(null)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-100 text-center mb-2">Delete Quiz?</h2>
            <p className="text-slate-400 text-center mb-6">
              Are you sure you want to delete "{deletingQuiz.title}"? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingQuiz(null)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
