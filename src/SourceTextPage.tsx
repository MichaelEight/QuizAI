import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { generateQuestions } from "./backendService";
import { Task } from "./QuestionsTypes";
import { Settings } from "./SettingsType";
import {
  extractTextFromFile,
  isSupportedFile,
  formatFileSize,
  UploadedFile,
} from "./services/fileExtractService";
import { FilePreviewModal } from "./components/FilePreviewModal";
import { countTokens, formatNumber, estimateCost, TOKEN_LIMIT } from "./services/tokenCounterService";

interface SourceTextPageProps {
  sourceText: string;
  setSourceText: (text: string) => void;
  setTasks: (tasks: Task[]) => void;
  settings: Settings;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const totalQuestions = settings.amountOfClosedQuestions + settings.amountOfOpenQuestions;

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
  const isOverLimit = totalTokens > TOKEN_LIMIT;

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(isSupportedFile);
    if (validFiles.length === 0) return;

    setIsExtracting(true);
    setError(null);

    for (const file of validFiles) {
      try {
        const content = await extractTextFromFile(file);
        if (content.trim()) {
          setUploadedFiles(prev => [...prev, {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt',
            content,
            size: file.size,
          }]);
        }
      } catch (err) {
        console.error(`Failed to extract ${file.name}:`, err);
        setError(`Failed to extract text from ${file.name}`);
      }
    }
    setIsExtracting(false);
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
    setUploadedFiles([]);
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

    try {
      const result = await generateQuestions(combinedText, settings);

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
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Input Source Text</h1>
        <p className="text-slate-400">
          Upload files or paste text to generate quiz questions
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg shadow-black/20 p-6">
        {/* Drop Zone */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Upload Files
          </label>
          <div
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
              accept=".txt,.pdf"
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
                  <p className="text-xs text-slate-500">Supports: .txt, .pdf</p>
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
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm hover:border-slate-500 transition-colors duration-200"
                >
                  <svg
                    className={`w-4 h-4 ${file.type === 'pdf' ? 'text-rose-400' : 'text-blue-400'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-slate-300 max-w-[150px] truncate">{file.name}</span>
                  <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                    className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    title="Edit extracted text"
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
                    title="Remove file"
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
            <button
              type="button"
              onClick={() => setSourceText("A little cat found a lost key in the yard. He wondered which door it might fit. After a while, he met an old mouse who had been looking for it for a long time. Together they opened a small box full of seeds.")}
              className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
            >
              Insert example text
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* Settings Summary */}
        <div className="mb-4 p-4 bg-slate-700/30 rounded-lg">
          <p className="text-sm text-slate-400">
            <span className="text-slate-300 font-medium">Will generate:</span>{" "}
            <span className="text-indigo-400">{settings.amountOfClosedQuestions}</span> closed +{" "}
            <span className="text-indigo-400">{settings.amountOfOpenQuestions}</span> open ={" "}
            <span className="text-slate-100 font-medium">{totalQuestions} questions</span>
          </p>
        </div>

        {/* Token & Cost Summary */}
        <div className={`mb-6 p-4 rounded-lg ${isOverLimit ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-slate-700/30'}`}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              <span className="text-slate-300 font-medium">Total input:</span>{" "}
              <span className={isOverLimit ? 'text-rose-400' : 'text-indigo-400'}>
                {formatNumber(totalTokens)}
              </span>{" "}
              / {formatNumber(TOKEN_LIMIT)} tokens
            </div>
            <div className="text-sm text-slate-400">
              <span className="text-slate-300 font-medium">Estimated cost:</span>{" "}
              <span className="text-emerald-400">{estimateCost(totalTokens)}</span>
            </div>
          </div>
          {isOverLimit && (
            <p className="mt-2 text-sm text-rose-400">
              Token limit exceeded. Remove some content to generate questions.
            </p>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateButtonClick}
          disabled={!canGenerate || isLoading || isExtracting || isOverLimit}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all duration-200 ${
            canGenerate && !isLoading && !isExtracting && !isOverLimit
              ? "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.99]"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
              Generating Questions...
            </>
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
    </div>
  );
}
