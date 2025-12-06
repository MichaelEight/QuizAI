import { useState, useEffect } from "react";
import { UploadedFile } from "../services/fileExtractService";
import { countTokens, formatNumber } from "../services/tokenCounterService";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: UploadedFile | null;
  onSave: (id: string, newContent: string) => void;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onSave,
}: FilePreviewModalProps) {
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    if (file) {
      setEditedContent(file.content);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleSave = () => {
    onSave(file.id, editedContent);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const wordCount = editedContent.split(/\s+/).filter(Boolean).length;
  const charCount = editedContent.length;
  const tokenCount = countTokens(editedContent);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <svg
              className={`w-5 h-5 ${file.type === 'pdf' ? 'text-rose-400' : 'text-blue-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{file.name}</h2>
              <p className="text-sm text-slate-400">Preview and edit extracted text</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full min-h-[300px] bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-sm"
            placeholder="No text extracted from file..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
          <div className="text-sm text-slate-500">
            {formatNumber(charCount)} characters · {formatNumber(wordCount)} words · {formatNumber(tokenCount)} tokens
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
