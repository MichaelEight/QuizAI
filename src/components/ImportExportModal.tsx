import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Task } from '../QuestionsTypes';
import {
  parseLegacyFiles,
  parseJsonImport,
  exportToJson,
  exportToLegacyZip,
  downloadFile,
} from '../services/legacyFormatService';
import { generateOpenQuestionAnswer } from '../backendService';
import { BaseModal } from './BaseModal';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: readonly Task[];
  setTasks: (tasks: Task[]) => void;
  sourceText: string;
}

type Status = {
  type: 'idle' | 'loading' | 'success' | 'error';
  message: string;
};

export function ImportExportModal({
  isOpen,
  onClose,
  tasks,
  setTasks,
  sourceText,
}: ImportExportModalProps) {
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  const legacyInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleClose = () => {
    setStatus({ type: 'idle', message: '' });
    onClose();
  };

  // Import Legacy (.txt files)
  const handleLegacyImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setStatus({ type: 'loading', message: 'Parsing files...' });

    try {
      const fileContents = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          content: await file.text(),
        }))
      );

      const result = parseLegacyFiles(fileContents);

      if (result.tasks.length === 0) {
        setStatus({
          type: 'error',
          message: result.errors.length > 0
            ? `No valid questions found. Errors: ${result.errors.join(', ')}`
            : 'No valid questions found in selected files',
        });
        return;
      }

      setTasks(result.tasks);
      setStatus({
        type: 'success',
        message: `Imported ${result.tasks.length} questions${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`,
      });

      // Navigate to quiz after short delay
      setTimeout(() => {
        handleClose();
        navigate('/quizPage');
      }, 1000);
    } catch (err) {
      setStatus({
        type: 'error',
        message: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }

    // Reset input
    if (legacyInputRef.current) {
      legacyInputRef.current.value = '';
    }
  };

  // Import JSON
  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus({ type: 'loading', message: 'Parsing JSON...' });

    try {
      const content = await file.text();
      const result = parseJsonImport(content);

      if (result.tasks.length === 0) {
        setStatus({
          type: 'error',
          message: result.errors.length > 0
            ? result.errors.join(', ')
            : 'No valid questions found in JSON file',
        });
        return;
      }

      setTasks(result.tasks);
      setStatus({
        type: 'success',
        message: `Imported ${result.tasks.length} questions`,
      });

      // Navigate to quiz after short delay
      setTimeout(() => {
        handleClose();
        navigate('/quizPage');
      }, 1000);
    } catch (err) {
      setStatus({
        type: 'error',
        message: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }

    // Reset input
    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  // Export JSON
  const handleJsonExport = () => {
    if (tasks.length === 0) {
      setStatus({ type: 'error', message: 'No questions to export' });
      return;
    }

    const json = exportToJson([...tasks]);
    downloadFile(json, 'quizai-export.json', 'application/json');
    setStatus({ type: 'success', message: `Exported ${tasks.length} questions as JSON` });
  };

  // Export Legacy (ZIP)
  const handleLegacyExport = async () => {
    if (tasks.length === 0) {
      setStatus({ type: 'error', message: 'No questions to export' });
      return;
    }

    setStatus({ type: 'loading', message: 'Generating answers for open questions...' });

    try {
      // Generate answers for open questions
      const openAnswers = new Map<string, string>();
      const openQuestions = tasks.filter(t => t.question.isOpen);

      for (const task of openQuestions) {
        // Use existing accepted answer if available
        if (task.answerOverride?.acceptedOpenAnswer) {
          openAnswers.set(task.id, task.answerOverride.acceptedOpenAnswer);
        } else if (sourceText) {
          // Generate answer using AI
          setStatus({
            type: 'loading',
            message: `Generating answer ${openAnswers.size + 1}/${openQuestions.length}...`,
          });
          const answer = await generateOpenQuestionAnswer(sourceText, task.question.value);
          openAnswers.set(task.id, answer);
        } else {
          // No source text available, use empty answer
          openAnswers.set(task.id, '');
        }
      }

      setStatus({ type: 'loading', message: 'Creating ZIP file...' });

      const zip = await exportToLegacyZip([...tasks], openAnswers);
      downloadFile(zip, 'quizai-export.zip');
      setStatus({ type: 'success', message: `Exported ${tasks.length} questions as legacy format` });
    } catch (err) {
      setStatus({
        type: 'error',
        message: `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
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
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Import / Export</h2>
            <p className="text-sm text-slate-400">Manage your quiz questions</p>
          </div>
        </div>

        {/* Import Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">Import</h3>
          <div className="space-y-2">
            {/* Legacy Import */}
            <label className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors duration-200">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-slate-200 font-medium">Import Legacy (.txt)</p>
                <p className="text-xs text-slate-400">Select multiple .txt files from baza folder</p>
              </div>
              <input
                ref={legacyInputRef}
                type="file"
                multiple
                accept=".txt"
                onChange={handleLegacyImport}
                className="hidden"
              />
            </label>

            {/* JSON Import */}
            <label className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors duration-200">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-slate-200 font-medium">Import JSON</p>
                <p className="text-xs text-slate-400">QuizAI native format</p>
              </div>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={handleJsonImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Export Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">Export</h3>
          <div className="space-y-2">
            {/* Legacy Export */}
            <button
              onClick={handleLegacyExport}
              disabled={tasks.length === 0 || status.type === 'loading'}
              className="flex items-center gap-3 p-3 w-full bg-slate-700/30 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 text-left"
            >
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-slate-200 font-medium">Export Legacy (.zip)</p>
                <p className="text-xs text-slate-400">Numbered .txt files in ZIP archive</p>
              </div>
            </button>

            {/* JSON Export */}
            <button
              onClick={handleJsonExport}
              disabled={tasks.length === 0 || status.type === 'loading'}
              className="flex items-center gap-3 p-3 w-full bg-slate-700/30 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 text-left"
            >
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-slate-200 font-medium">Export JSON</p>
                <p className="text-xs text-slate-400">Full data with all metadata</p>
              </div>
            </button>
          </div>
        </div>

        {/* Status */}
        {status.message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              status.type === 'loading'
                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                : status.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : status.type === 'error'
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                : ''
            }`}
          >
            <div className="flex items-center gap-2">
              {status.type === 'loading' && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {status.message}
            </div>
          </div>
        )}

        {/* Question count */}
        <div className="mt-4 text-center text-xs text-slate-500">
          {tasks.length} questions currently loaded
        </div>
    </BaseModal>
  );
}
