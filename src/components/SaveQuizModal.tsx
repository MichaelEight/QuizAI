import { useState, useEffect } from 'react';
import { useQuizLibrary } from '../context/QuizLibraryContext';
import { useSaveQuizModal } from '../context/SaveQuizModalContext';
import { BaseModal } from './BaseModal';

export function SaveQuizModal() {
  const { saveQuiz, updateQuizContent } = useQuizLibrary();
  const { isOpen, modalData, closeSaveQuizModal } = useSaveQuizModal();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teacher, setTeacher] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset or pre-fill form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setTeacher('');
      setSubjectName('');
      setSubjectCode('');
      setError(null);
    } else if (modalData?.mode === 'update' && modalData.existingMetadata) {
      // Pre-fill form with existing metadata for update mode
      setTitle(modalData.existingMetadata.title || '');
      setDescription(modalData.existingMetadata.description || '');
      setTeacher(modalData.existingMetadata.teacher || '');
      setSubjectName(modalData.existingMetadata.subjectName || '');
      setSubjectCode(modalData.existingMetadata.subjectCode || '');
    }
  }, [isOpen, modalData]);

  if (!modalData) return null;

  const { tasks, sourceText, uploadedFileNames, onSaved, mode, quizId, currentVersion } = modalData;

  const closedCount = tasks.filter(t => !t.question.isOpen).length;
  const openCount = tasks.filter(t => t.question.isOpen).length;

  const handleClose = () => {
    closeSaveQuizModal();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let savedQuiz;

      if (mode === 'update' && quizId) {
        // Update existing quiz content
        await updateQuizContent(quizId, [...tasks], sourceText, uploadedFileNames);
      } else {
        // Save as new quiz
        savedQuiz = await saveQuiz({
          title: title.trim(),
          description: description.trim() || undefined,
          teacher: teacher.trim() || undefined,
          subjectName: subjectName.trim() || undefined,
          subjectCode: subjectCode.trim() || undefined,
          tasks: [...tasks],
          sourceText,
          uploadedFileNames,
        });
      }

      handleClose();
      onSaved?.(savedQuiz);
    } catch {
      setError(mode === 'update' ? 'Failed to update quiz. Please try again.' : 'Failed to save quiz. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate suggested title
  const suggestedTitle = tasks[0]?.question.value
    ? tasks[0].question.value.slice(0, 50) + (tasks[0].question.value.length > 50 ? '...' : '')
    : `Quiz - ${new Date().toLocaleDateString()}`;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
          {mode === 'update' ? (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'update' ? `Update Quiz (v${currentVersion} → v${(currentVersion || 1) + 1})` : 'Save to Library'}
          </h2>
          <p className="text-sm text-slate-500">
            {mode === 'update' ? 'Update quiz with new content' : 'Save this quiz for later use'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Title <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={suggestedTitle}
            className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Description <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this quiz..."
            rows={2}
            className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none"
          />
        </div>

        {/* Subject row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Subject <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g., Biology"
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Code
            </label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="CS101"
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Teacher */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Teacher <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            placeholder="Teacher or professor name"
            className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          />
        </div>

        {/* Quiz info (read-only) */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Quiz Contents</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">
              <span className="text-emerald-600 font-medium">{tasks.length}</span> questions
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">
              {closedCount} closed, {openCount} open
            </span>
          </div>
          {sourceText && (
            <p className="text-xs text-slate-400 mt-2 truncate">
              Source: {sourceText.slice(0, 100)}...
            </p>
          )}
        </div>

        {/* Update mode warning */}
        {mode === 'update' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="text-amber-600 font-medium">Updating existing quiz</p>
              <p className="text-amber-600 mt-1">
                A backup of v{currentVersion || 1} will be created. Only one backup is kept at a time.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {mode === 'update' ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                {mode === 'update' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {mode === 'update' ? `Update to v${(currentVersion || 1) + 1}` : 'Save Quiz'}
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
