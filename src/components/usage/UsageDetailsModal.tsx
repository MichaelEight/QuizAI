import { QuizUsageStats, OperationType } from "../../types/usage";
import { BaseModal } from "../BaseModal";
import {
  formatCurrency,
  formatNumber,
  formatDateTime,
} from "../../utils/formatters";

interface UsageDetailsModalProps {
  quiz: QuizUsageStats | null;
  onClose: () => void;
}

const OPERATION_LABELS: Record<OperationType, string> = {
  quiz_generation: "Quiz Generation",
  open_answer_grading: "Answer Grading",
  hint_generation: "Hint Generation",
  explanation_generation: "Explanation Generation",
  answer_generation: "Answer Generation",
  score_rubric_generation: "Score Rubric",
  chat_message: "Chat Messages",
  task_translation: "Task Translation",
  metadata_translation: "Metadata Translation",
};

const OPERATION_ICONS: Record<OperationType, React.ReactNode> = {
  quiz_generation: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  open_answer_grading: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  hint_generation: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  explanation_generation: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  answer_generation: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  score_rubric_generation: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  chat_message: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  task_translation: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  ),
  metadata_translation: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  ),
};

export function UsageDetailsModal({ quiz, onClose }: UsageDetailsModalProps) {
  if (!quiz) return null;

  // Sort logs by timestamp (newest first)
  const sortedLogs = [...quiz.logs].sort((a, b) => b.timestamp - a.timestamp);

  // Calculate cost per operation type
  const operationCosts = quiz.logs.reduce((acc, log) => {
    acc[log.operationType] = (acc[log.operationType] || 0) + log.costUSD;
    return acc;
  }, {} as Record<OperationType, number>);

  // Get operations with non-zero counts
  const activeOperations = (
    Object.entries(quiz.byOperationType) as [OperationType, number][]
  ).filter(([, count]) => count > 0);

  return (
    <BaseModal isOpen={true} onClose={onClose} maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">
            Usage Details
          </h2>
          <p className="text-slate-400">{quiz.quizTitle}</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Total Requests</p>
            <p className="text-lg font-bold text-slate-100">
              {formatNumber(quiz.totalRequests)}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Total Tokens</p>
            <p className="text-lg font-bold text-slate-100">
              {formatNumber(quiz.totalTokens)}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Total Cost</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(quiz.totalCostUSD)}
            </p>
          </div>
        </div>

        {/* Breakdown by Operation Type */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Breakdown by Operation Type
          </h3>
          <div className="space-y-2">
            {activeOperations.map(([operationType, count]) => (
              <div
                key={operationType}
                className="flex items-center justify-between bg-slate-900/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-indigo-400">
                    {OPERATION_ICONS[operationType]}
                  </div>
                  <span className="text-sm text-slate-300">
                    {OPERATION_LABELS[operationType]}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    {formatNumber(count)} requests
                  </span>
                  <span className="text-sm font-medium text-emerald-400 min-w-[80px] text-right">
                    {formatCurrency(operationCosts[operationType] || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual API Calls */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Recent API Calls ({sortedLogs.length})
          </h3>
          <div className="bg-slate-900/30 rounded-lg max-h-64 overflow-y-auto">
            <div className="divide-y divide-slate-700">
              {sortedLogs.map((log) => (
                <div
                  key={log.id}
                  className="px-4 py-3 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="text-indigo-400 text-xs">
                        {OPERATION_ICONS[log.operationType]}
                      </div>
                      <span className="text-sm text-slate-300">
                        {OPERATION_LABELS[log.operationType]}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-emerald-400">
                      {formatCurrency(log.costUSD)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{formatDateTime(log.timestamp)}</span>
                    <span>•</span>
                    <span>{formatNumber(log.totalTokens)} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
