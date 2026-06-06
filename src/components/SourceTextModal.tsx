import { useState } from 'react';
import { BaseModal } from './BaseModal';

interface SourceTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceText: string;
  quizTitle: string;
}

export function SourceTextModal({
  isOpen,
  onClose,
  sourceText,
  quizTitle
}: SourceTextModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sourceText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Source Text
          </h2>
          <p className="text-sm text-slate-500">{quizTitle}</p>
        </div>
      </div>

      {/* Source text display */}
      <div className="mb-6">
        <div className="relative">
          <pre className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
            {sourceText}
          </pre>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <span>{sourceText.length} characters</span>
          <span>{sourceText.split(/\s+/).filter(w => w.length > 0).length} words</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors">
          Close
        </button>
        <button
          onClick={handleCopyToClipboard}
          className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
          {copySuccess ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </>
          )}
        </button>
      </div>
    </BaseModal>
  );
}
