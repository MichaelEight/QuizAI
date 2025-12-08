import { useState, useEffect } from 'react';
import { useQuizLibrary } from '../context/QuizLibraryContext';
import { useSaveQuizModal } from '../context/SaveQuizModalContext';
import { BaseModal } from './BaseModal';

export function SaveQuizModal() {
  const { saveQuiz } = useQuizLibrary();
  const { isOpen, modalData, closeSaveQuizModal } = useSaveQuizModal();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teacher, setTeacher] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setTeacher('');
      setSubjectName('');
      setSubjectCode('');
      setError(null);
    }
  }, [isOpen]);

  if (!modalData) return null;

  const { tasks, sourceText, uploadedFileNames, onSaved } = modalData;

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
      await saveQuiz({
        title: title.trim(),
        description: description.trim() || undefined,
        teacher: teacher.trim() || undefined,
        subjectName: subjectName.trim() || undefined,
        subjectCode: subjectCode.trim() || undefined,
        tasks: [...tasks],
        sourceText,
        uploadedFileNames,
      });

      handleClose();
      onSaved?.();
    } catch (err) {
      setError('Failed to save quiz. Please try again.');
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
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Save to Library</h2>
          <p className="text-sm text-slate-400">Save this quiz for later use</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={suggestedTitle}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Description <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this quiz..."
            rows={2}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none"
          />
        </div>

        {/* Subject row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Subject <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g., Biology"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Code
            </label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="CS101"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Teacher */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Teacher <span className="text-slate-500">(optional)</span>
          </label>
          <input
            type="text"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            placeholder="Teacher or professor name"
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          />
        </div>

        {/* Quiz info (read-only) */}
        <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Quiz Contents</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-300">
              <span className="text-emerald-400 font-medium">{tasks.length}</span> questions
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              {closedCount} closed, {openCount} open
            </span>
          </div>
          {sourceText && (
            <p className="text-xs text-slate-500 mt-2 truncate">
              Source: {sourceText.slice(0, 100)}...
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
