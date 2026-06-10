import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router";
import { useGeneration } from "./context/GenerationContext";
import { Settings } from "./SettingsType";
import {
  extractTextFromFile,
  isSupportedFile,
  formatFileSize,
  getFileTypeFromName,
  UploadedFile,
} from "./services/fileExtractService";
import { FilePreviewModal } from "./components/FilePreviewModal";
import { countTokens, formatNumber, estimateCost, getAvailableTokens } from "./services/tokenCounterService";
import {
  MODELS,
  MODEL_LIST,
  ModelId,
  getSelectedModel,
  getQuizModelOverride,
  setQuizModelOverride,
} from "./services/constants";
import { SuccessToast } from "./components/SuccessToast";
import { BaseModal } from "./components/BaseModal";
import { GenerationProgress } from "./components/GenerationProgress";

interface SourceTextPageProps {
  sourceText: string;
  setSourceText: (text: string) => void;
  settings: Settings;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

// Helper Components

function HelpIcon({ tooltip }: { tooltip: string }) {
  return (
    <button
      type="button"
      title={tooltip}
      className="inline-flex items-center justify-center w-4 h-4 text-slate-400 hover:text-slate-200 transition-colors duration-200 cursor-help"
      onClick={(e) => e.preventDefault()}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
}

function TokenWarnings({ totalTokens, availableTokens }: { totalTokens: number; availableTokens: number }) {
  const percentage = (totalTokens / availableTokens) * 100;
  const remaining = availableTokens - totalTokens;

  if (percentage < 80) return null;

  return (
    <div className="mb-4">
      {percentage >= 80 && percentage < 100 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm text-amber-400 font-medium">Approaching token limit</p>
            <p className="text-xs text-amber-400/80 mt-1">
              {formatNumber(remaining)} tokens remaining. Consider removing some content if generation fails.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface ConfirmClearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileCount: number;
}

function ConfirmClearModal({ isOpen, onClose, onConfirm, fileCount }: ConfirmClearModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Remove All Files?
            </h2>
            <p className="text-sm text-slate-400">
              This will remove {fileCount} {fileCount === 1 ? 'file' : 'files'} from the upload list. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors duration-200"
          >
            Remove All Files
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export default function SourceTextPage({
  sourceText,
  setSourceText,
  settings,
  uploadedFiles,
  setUploadedFiles,
}: SourceTextPageProps) {
  const [error, setError] = useState<string | null>(null);
  // Generation runs in app-level context so it survives page navigation.
  // Aliased to the previous local names to keep the JSX below unchanged.
  const {
    isGenerating: isLoading,
    progress: generationProgress,
    elapsedTime,
    error: genError,
    start: startGeneration,
  } = useGeneration();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalQuestions = settings.amountOfClosedQuestions + settings.amountOfOpenQuestions;

  // Draft auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim()) {
        localStorage.setItem('quizai_draft_text', sourceText);
        localStorage.setItem('quizai_draft_timestamp', Date.now().toString());
      } else {
        localStorage.removeItem('quizai_draft_text');
        localStorage.removeItem('quizai_draft_timestamp');
      }
    }, 1000); // Debounced 1 second

    return () => clearTimeout(timer);
  }, [sourceText]);

  // Restore draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('quizai_draft_text');
    const savedTimestamp = localStorage.getItem('quizai_draft_timestamp');

    if (savedDraft && !sourceText && !uploadedFiles.length) {
      const timestamp = savedTimestamp ? parseInt(savedTimestamp, 10) : 0;
      const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);

      // Only restore if less than 24 hours old
      if (hoursSince < 24) {
        setSourceText(savedDraft);
        setSuccessMessage("Draft restored from previous session");
      } else {
        localStorage.removeItem('quizai_draft_text');
        localStorage.removeItem('quizai_draft_timestamp');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // Combine file content with manual text
  const combinedText = useMemo(() => {
    const fileTexts = uploadedFiles.map(f => f.content).join('\n\n');
    return fileTexts + (fileTexts && sourceText ? '\n\n' : '') + sourceText;
  }, [uploadedFiles, sourceText]);

  const canGenerate = combinedText.trim().length > 0 && totalQuestions > 0;

  // Token calculations
  const fileTokens = useMemo(() => {
    return uploadedFiles.map(f => ({ id: f.id, tokens: countTokens(f.content) }));
  }, [uploadedFiles]);

  const totalFileTokens = useMemo(() =>
    fileTokens.reduce((sum, f) => sum + f.tokens, 0)
  , [fileTokens]);

  const textareaTokens = useMemo(() => countTokens(sourceText), [sourceText]);

  const totalTokens = totalFileTokens + textareaTokens;

  // Per-quiz model override ("" = use the global AI model). Only this quiz's
  // generation uses it; all other AI usage stays on the global model.
  const globalModel = getSelectedModel();
  const [quizModelOverride, setQuizModelOverrideState] = useState<ModelId | "">(
    () => getQuizModelOverride()
  );
  const effectiveModel: ModelId = quizModelOverride || globalModel;

  const handleQuizModelChange = (value: ModelId | "") => {
    setQuizModelOverrideState(value);
    setQuizModelOverride(value);
  };

  // Calculate available tokens based on the model that will generate this quiz
  const availableTokens = useMemo(() =>
    getAvailableTokens(
      settings.contentFocus,
      settings.difficultyLevel,
      settings.customInstructions,
      effectiveModel
    )
  , [settings.contentFocus, settings.difficultyLevel, settings.customInstructions, effectiveModel]);

  const isOverLimit = totalTokens > availableTokens;

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(isSupportedFile);
    if (validFiles.length === 0) {
      setError("No supported files found. Supported formats: .txt, .pdf, .md, .csv, .json");
      return;
    }

    setIsExtracting(true);
    setError(null);

    let successCount = 0;
    for (const file of validFiles) {
      try {
        const content = await extractTextFromFile(file);
        if (content.trim()) {
          const tokens = countTokens(content);
          setUploadedFiles(prev => [...prev, {
            id: crypto.randomUUID(),
            name: file.name,
            type: getFileTypeFromName(file.name) ?? 'txt',
            content,
            size: file.size,
          }]);
          successCount++;
          // Show success for each file
          setSuccessMessage(`${file.name} uploaded - ${formatNumber(tokens)} tokens extracted`);
        } else {
          setError(`${file.name} appears to be empty or contains no extractable text.`);
        }
      } catch (err) {
        console.error(`Failed to extract ${file.name}:`, err);
        const errorMessage = err instanceof Error ? err.message : '';

        // More specific error messages
        if (errorMessage.includes('size') || file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is too large (max 10MB). Try splitting into smaller files.`);
        } else if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
          setError(`${file.name} is password-protected. Please remove password and try again.`);
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
          setError(`${file.name} extraction failed. Ensure it contains selectable text (not scanned images).`);
        } else {
          setError(`Failed to extract ${file.name}. The file may be corrupted or in an unsupported format.`);
        }
      }
    }

    setIsExtracting(false);

    // Summary message if multiple files
    if (successCount > 1) {
      setTimeout(() => {
        setSuccessMessage(`${successCount} files uploaded successfully`);
      }, 500);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
    setShowClearModal(true);
  };

  const confirmClearAll = () => {
    setUploadedFiles([]);
    setShowClearModal(false);
    setSuccessMessage("All files removed");
  };

  const updateFileContent = (id: string, newContent: string) => {
    setUploadedFiles(prev => prev.map(f =>
      f.id === id ? { ...f, content: newContent } : f
    ));
  };

  const handleGenerateButtonClick = () => {
    if (!canGenerate) return;
    setError(null);
    // Kick off generation in the app-level context. It keeps running across
    // navigation and shows a global "quiz ready" toast when done.
    startGeneration({
      text: combinedText,
      settings,
      modelOverride: quizModelOverride || undefined,
      target: totalQuestions,
    });
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-1 sm:mb-2">Input Source Text</h1>
          <p className="text-sm sm:text-base text-slate-400">
            Upload files or paste text to generate quiz questions
          </p>
        </div>
        <Link
          to="/library"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors border border-slate-600 w-full sm:w-auto"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Load from Library
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-black/20 p-4 sm:p-6">
        {/* Drop Zone */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-slate-300">
              Upload Files
            </label>
            <HelpIcon tooltip="Upload PDF or TXT files. We extract text automatically and you can edit it after upload if needed." />
          </div>
          <div
            role="button"
            aria-label="Upload files - drag and drop or click to browse"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.pdf,.md,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              {isExtracting ? (
                <>
                  <svg className="animate-spin h-8 w-8 text-indigo-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-slate-300">Extracting text...</p>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-slate-300">
                    Drop files here or <span className="text-indigo-400">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-500">Supports: .txt, .pdf, .md, .csv, .json</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-300">
                  Uploaded files ({uploadedFiles.length})
                </span>
                <span className="text-xs text-slate-500">
                  {formatNumber(totalFileTokens)} tokens
                </span>
              </div>
              <button
                onClick={clearAllFiles}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors duration-200"
                aria-label={`Remove all ${uploadedFiles.length} files`}
              >
                Clear all
              </button>
            </div>
            <div role="list" aria-label="Uploaded files" className="flex flex-wrap gap-2">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  role="listitem"
                  className="group flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm hover:border-slate-500 transition-colors duration-200"
                >
                  <svg
                    className={`w-4 h-4 ${
                      file.type === 'pdf' ? 'text-rose-400' :
                      file.type === 'md' ? 'text-purple-400' :
                      file.type === 'csv' ? 'text-emerald-400' :
                      file.type === 'json' ? 'text-amber-400' :
                      'text-blue-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-slate-300 max-w-[100px] sm:max-w-[150px] md:max-w-[200px] truncate">{file.name}</span>
                  <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                    className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Edit ${file.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="text-slate-400 hover:text-rose-400 transition-colors duration-200"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="mb-4">
          <label htmlFor="sourceText" className="block text-sm font-medium text-slate-300 mb-2">
            Additional Text {uploadedFiles.length > 0 && "(optional)"}
          </label>
          <textarea
            id="sourceText"
            className="w-full h-48 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            placeholder={uploadedFiles.length > 0
              ? "Add more text here (will be combined with uploaded files)..."
              : "Paste your text here... The AI will generate questions based on this content."
            }
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
          <div className="flex justify-between items-center mt-2 text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <span>{formatNumber(combinedText.length)} characters</span>
              <span>{formatNumber(combinedText.split(/\s+/).filter(Boolean).length)} words</span>
              <span>{formatNumber(textareaTokens)} tokens</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSourceText("")}
                disabled={!sourceText}
                className={`transition-colors duration-200 ${
                  sourceText
                    ? "text-slate-400 hover:text-rose-400"
                    : "text-slate-600 cursor-not-allowed"
                }`}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setSourceText("A little cat found a lost key in the yard. He wondered which door it might fit. After a while, he met an old mouse who had been looking for it for a long time. Together they opened a small box full of seeds.")}
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
              >
                Insert example
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {(error || genError) && (
          <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <p className="text-rose-400 text-sm">{error || genError}</p>
          </div>
        )}

        {/* Settings Summary */}
        <div className="mb-4 p-4 bg-slate-700/30 rounded-lg">
          <p className="text-sm text-slate-400 mb-2">
            <span className="text-slate-300 font-medium">Will generate:</span>{" "}
            <span className="text-indigo-400">{settings.amountOfClosedQuestions}</span> multiple-choice +{" "}
            <span className="text-indigo-400">{settings.amountOfOpenQuestions}</span> free-response ={" "}
            <span className="text-slate-100 font-medium">{totalQuestions} questions</span>
          </p>

          {/* Per-quiz AI model (defaults to the global model) */}
          <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="quiz-model" className="text-xs font-medium text-slate-400">
              AI model for this quiz
            </label>
            <select
              id="quiz-model"
              value={quizModelOverride}
              onChange={(e) => handleQuizModelChange(e.target.value as ModelId | "")}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 transition-colors focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Global default — {MODELS[globalModel]?.label}</option>
              {MODEL_LIST.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-300">
              {settings.difficultyLevel === 'mixed' ? 'Mixed difficulty' : `${settings.difficultyLevel} difficulty`}
            </span>
            <span className="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-300">
              {settings.contentFocus === 'important' ? 'Key concepts only' : 'All content'}
            </span>
            <span className="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-300">
              {settings.questionStyle === 'conceptual' ? 'Conceptual' : 'Text-based'}
            </span>
            {settings.quizLanguage !== 'english' && (
              <span className="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-300">
                {settings.quizLanguage === 'polish' ? 'Polski' :
                 settings.quizLanguage === 'spanish' ? 'Español' :
                 settings.quizLanguage === 'german' ? 'Deutsch' : settings.quizLanguage}
              </span>
            )}
          </div>
        </div>

        {/* Token Warnings */}
        <TokenWarnings totalTokens={totalTokens} availableTokens={availableTokens} />

        {/* Token & Cost Summary with Progress Bar */}
        <div className={`mb-6 p-4 rounded-lg ${isOverLimit ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-slate-700/30'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300 font-medium">Token usage</span>
              <HelpIcon tooltip="Tokens measure text length for AI processing. ~1 token ≈ 4 characters. The limit ensures quality and cost control." />
            </div>
            <div className="text-sm text-slate-400">
              <span className="text-slate-300 font-medium">Cost:</span>{" "}
              <span className="text-emerald-400">{estimateCost(totalTokens, effectiveModel)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">
                {formatNumber(totalTokens)} / {formatNumber(availableTokens)} tokens
              </span>
              <span className="text-xs text-slate-400">
                {Math.min(Math.round((totalTokens / availableTokens) * 100), 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverLimit ? 'bg-rose-500' :
                  (totalTokens / availableTokens) >= 0.8 ? 'bg-amber-500' :
                  'bg-indigo-500'
                }`}
                style={{ width: `${Math.min((totalTokens / availableTokens) * 100, 100)}%` }}
              />
            </div>
          </div>

          {isOverLimit && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm text-rose-400">
                Token limit exceeded by {formatNumber(totalTokens - availableTokens)} tokens. Remove some content to continue.
              </p>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateButtonClick}
          disabled={!canGenerate || isLoading || isExtracting || isOverLimit}
          aria-label={`Generate ${totalQuestions} questions from ${formatNumber(totalTokens)} tokens`}
          aria-busy={isLoading}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all duration-200 ${
            canGenerate && !isLoading && !isExtracting && !isOverLimit
              ? "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.99]"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <div className="w-full px-4">
              <GenerationProgress
                currentType={generationProgress.currentType}
                currentAttempt={generationProgress.currentAttempt}
                maxAttempts={generationProgress.maxAttempts}
                questionsReceived={generationProgress.questionsReceived}
                questionsTarget={generationProgress.questionsTarget}
                typeBreakdown={generationProgress.typeBreakdown}
                elapsedTime={elapsedTime}
              />
            </div>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Questions
            </>
          )}
        </button>

        {/* Help Text */}
        {!canGenerate && !isLoading && (
          <p className="mt-4 text-center text-sm text-slate-500">
            {combinedText.trim().length === 0
              ? "Upload files or enter text to generate questions"
              : "Configure at least one question in Settings"}
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Tips for better results:</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>Use clear, factual text with specific information</li>
          <li>Longer texts with more details produce better questions</li>
          <li>PDF files with selectable text work best</li>
          <li>Combine multiple sources for comprehensive quizzes</li>
        </ul>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onSave={updateFileContent}
      />

      {/* Success Toast */}
      {successMessage && (
        <SuccessToast
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {/* Confirm Clear All Modal */}
      <ConfirmClearModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClearAll}
        fileCount={uploadedFiles.length}
      />
    </div>
  );
}
