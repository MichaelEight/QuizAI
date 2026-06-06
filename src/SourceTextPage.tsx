import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { generateQuestions, ProgressEvent, ProgressCallback } from "./backendService";
import { Task } from "./QuestionsTypes";
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
import { MODELS } from "./services/constants";
import { SuccessToast } from "./components/SuccessToast";
import { BaseModal } from "./components/BaseModal";
import { GenerationProgress } from "./components/GenerationProgress";

interface SourceTextPageProps {
  sourceText: string;
  setSourceText: (text: string) => void;
  setTasks: (tasks: Task[]) => void;
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
      className="inline-flex items-center justify-center w-4 h-4 text-slate-500 hover:text-slate-800 transition-colors duration-200 cursor-help"
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
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm text-amber-600 font-medium">Approaching token limit</p>
            <p className="text-xs text-amber-600 mt-1">
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
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Remove All Files?
            </h2>
            <p className="text-sm text-slate-500">
              This will remove {fileCount} {fileCount === 1 ? 'file' : 'files'} from the upload list. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors duration-200"
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
  setTasks,
  settings,
  uploadedFiles,
  setUploadedFiles,
}: SourceTextPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const totalQuestions = settings.amountOfClosedQuestions + settings.amountOfOpenQuestions;

  // Progress tracking state
  interface GenerationProgress {
    currentType: string | null;
    currentAttempt: number;
    maxAttempts: number;
    questionsReceived: number;
    questionsTarget: number;
    typeBreakdown: {
      [key: string]: {
        received: number;
        target: number;
        complete: boolean;
      };
    };
    stage: string;
  }

  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    currentType: null,
    currentAttempt: 0,
    maxAttempts: 3,
    questionsReceived: 0,
    questionsTarget: totalQuestions,
    typeBreakdown: {},
    stage: 'idle',
  });

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

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

  // Timer to update elapsed time during generation
  useEffect(() => {
    if (!isLoading || !startTime) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100); // Update every 100ms for smooth display

    return () => clearInterval(interval);
  }, [isLoading, startTime]);

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

  // Calculate available tokens based on current settings (subtracts system prompt + output reserve)
  const availableTokens = useMemo(() =>
    getAvailableTokens(
      settings.contentFocus,
      settings.difficultyLevel,
      settings.customInstructions,
      settings.model
    )
  , [settings.contentFocus, settings.difficultyLevel, settings.customInstructions, settings.model]);

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

  const handleGenerateButtonClick = async () => {
    if (!canGenerate) return;

    setIsLoading(true);
    setError(null);
    setStartTime(Date.now());

    // Initialize progress
    setGenerationProgress({
      currentType: null,
      currentAttempt: 0,
      maxAttempts: 3,
      questionsReceived: 0,
      questionsTarget: totalQuestions,
      typeBreakdown: {},
      stage: 'init',
    });

    // Progress callback
    const handleProgress: ProgressCallback = (event: ProgressEvent) => {
      setGenerationProgress(prev => {
        const next = { ...prev };

        switch (event.stage) {
          case 'init':
            next.stage = 'init';
            break;

          case 'attempt_start':
            next.currentType = event.typeName ?? null;
            next.currentAttempt = event.attempt ?? 0;
            next.stage = 'generating';
            break;

          case 'questions_received':
            next.questionsReceived = event.total ?? prev.questionsReceived;

            // Update type breakdown
            if (event.typeName) {
              next.typeBreakdown[event.typeName] = {
                received: event.total ?? 0,
                target: event.target ?? 0,
                complete: (event.total ?? 0) >= (event.target ?? 0),
              };
            }
            break;

          case 'type_complete':
            if (event.typeName) {
              next.typeBreakdown[event.typeName] = {
                received: event.total ?? 0,
                target: event.target ?? 0,
                complete: true,
              };
            }
            break;

          case 'all_complete':
            next.stage = 'complete';
            break;
        }

        return next;
      });
    };

    try {
      const result = await generateQuestions(combinedText, settings, handleProgress);

      if (!result || result.length === 0) {
        setError("No questions were generated. Please try with different text.");
        return;
      }

      setTasks(result);
      navigate("/quizPage");
    } catch (err) {
      setError("Failed to generate questions. Please check your API key and try again.");
      console.error("Error generating questions:", err);
    } finally {
      setIsLoading(false);
      setStartTime(null);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">Input Source Text</h1>
          <p className="text-sm sm:text-base text-slate-500">
            Upload files or paste text to generate quiz questions
          </p>
        </div>
        <Link
          to="/library"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors border border-slate-300 w-full sm:w-auto"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Load from Library
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-900/5 p-4 sm:p-6">
        {/* Drop Zone */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-slate-600">
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
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 hover:border-slate-400 hover:bg-slate-100"
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
                  <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-slate-600">Extracting text...</p>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-slate-600">
                    Drop files here or <span className="text-indigo-600">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-400">Supports: .txt, .pdf, .md, .csv, .json</p>
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
                <span className="text-sm font-medium text-slate-600">
                  Uploaded files ({uploadedFiles.length})
                </span>
                <span className="text-xs text-slate-400">
                  {formatNumber(totalFileTokens)} tokens
                </span>
              </div>
              <button
                onClick={clearAllFiles}
                className="text-xs text-slate-500 hover:text-rose-700 transition-colors duration-200"
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
                  className="group flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-sm hover:border-slate-400 transition-colors duration-200"
                >
                  <svg
                    className={`w-4 h-4 ${
                      file.type === 'pdf' ? 'text-rose-600' :
                      file.type === 'md' ? 'text-purple-600' :
                      file.type === 'csv' ? 'text-emerald-600' :
                      file.type === 'json' ? 'text-amber-600' :
                      'text-blue-600'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-slate-600 max-w-[100px] sm:max-w-[150px] md:max-w-[200px] truncate">{file.name}</span>
                  <span className="text-slate-400 text-xs">{formatFileSize(file.size)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                    className="text-slate-500 hover:text-indigo-700 transition-colors duration-200 sm:opacity-0 sm:group-hover:opacity-100"
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
                    className="text-slate-500 hover:text-rose-700 transition-colors duration-200"
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
          <label htmlFor="sourceText" className="block text-sm font-medium text-slate-600 mb-2">
            Additional Text {uploadedFiles.length > 0 && "(optional)"}
          </label>
          <textarea
            id="sourceText"
            className="w-full h-48 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            placeholder={uploadedFiles.length > 0
              ? "Add more text here (will be combined with uploaded files)..."
              : "Paste your text here... The AI will generate questions based on this content."
            }
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
          <div className="flex justify-between items-center mt-2 text-sm text-slate-400">
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
                    ? "text-slate-500 hover:text-rose-700"
                    : "text-slate-400 cursor-not-allowed"
                }`}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setSourceText("A little cat found a lost key in the yard. He wondered which door it might fit. After a while, he met an old mouse who had been looking for it for a long time. Together they opened a small box full of seeds.")}
                className="text-indigo-600 hover:text-indigo-600 transition-colors duration-200"
              >
                Insert example
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        )}

        {/* Settings Summary */}
        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-500 mb-2">
            <span className="text-slate-600 font-medium">Will generate:</span>{" "}
            <span className="text-indigo-600">{settings.amountOfClosedQuestions}</span> multiple-choice +{" "}
            <span className="text-indigo-600">{settings.amountOfOpenQuestions}</span> free-response ={" "}
            <span className="text-slate-900 font-medium">{totalQuestions} questions</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-indigo-50 text-indigo-500 rounded text-xs font-medium">
              {(MODELS[settings.model] ?? MODELS['gpt-4o-mini']).label}
            </span>
            <span className="px-2 py-1 bg-slate-200 rounded text-xs text-slate-600">
              {settings.difficultyLevel === 'mixed' ? 'Mixed difficulty' : `${settings.difficultyLevel} difficulty`}
            </span>
            <span className="px-2 py-1 bg-slate-200 rounded text-xs text-slate-600">
              {settings.contentFocus === 'important' ? 'Key concepts only' : 'All content'}
            </span>
            <span className="px-2 py-1 bg-slate-200 rounded text-xs text-slate-600">
              {settings.questionStyle === 'conceptual' ? 'Conceptual' : 'Text-based'}
            </span>
            {settings.quizLanguage !== 'english' && (
              <span className="px-2 py-1 bg-slate-200 rounded text-xs text-slate-600">
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
        <div className={`mb-6 p-4 rounded-lg ${isOverLimit ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-medium">Token usage</span>
              <HelpIcon tooltip="Tokens measure text length for AI processing. ~1 token ≈ 4 characters. The limit ensures quality and cost control." />
            </div>
            <div className="text-sm text-slate-500">
              <span className="text-slate-600 font-medium">Cost:</span>{" "}
              <span className="text-emerald-600">{estimateCost(totalTokens, settings.model)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">
                {formatNumber(totalTokens)} / {formatNumber(availableTokens)} tokens
              </span>
              <span className="text-xs text-slate-500">
                {Math.min(Math.round((totalTokens / availableTokens) * 100), 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverLimit ? 'bg-rose-600' :
                  (totalTokens / availableTokens) >= 0.8 ? 'bg-amber-500' :
                  'bg-indigo-600'
                }`}
                style={{ width: `${Math.min((totalTokens / availableTokens) * 100, 100)}%` }}
              />
            </div>
          </div>

          {isOverLimit && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm text-rose-600">
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
              ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.99]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
          <p className="mt-4 text-center text-sm text-slate-400">
            {combinedText.trim().length === 0
              ? "Upload files or enter text to generate questions"
              : "Configure at least one question in Settings"}
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Tips for better results:</h3>
        <ul className="text-sm text-slate-500 space-y-1">
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
