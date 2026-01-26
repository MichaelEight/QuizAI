import { useState } from "react";
import { useUsage } from "./context/UsageContext";
import { QuizUsageStats, OperationType } from "./types/usage";
import { StatsCard } from "./components/usage/StatsCard";
import { QuizUsageTable } from "./components/usage/QuizUsageTable";
import { UsageDetailsModal } from "./components/usage/UsageDetailsModal";
import { ExportButton } from "./components/usage/ExportButton";
import { DateRangePicker } from "./components/usage/DateRangePicker";
import { formatCurrency, formatNumber } from "./utils/formatters";

const OPERATION_LABELS: Record<OperationType, string> = {
  quiz_generation: "Quiz Generation",
  open_answer_grading: "Answer Grading",
  hint_generation: "Hints",
  explanation_generation: "Explanations",
  answer_generation: "Answers",
  score_rubric_generation: "Rubrics",
  chat_message: "Chat",
  task_translation: "Task Translation",
  metadata_translation: "Metadata Translation",
};

export default function UsagePage() {
  const {
    logs,
    globalStats,
    isLoading,
    dateRange,
    setDateRange,
    deleteAllLogs,
    getTopQuizzes,
    refreshUsage,
  } = useUsage();

  const [selectedQuiz, setSelectedQuiz] = useState<QuizUsageStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const topQuizzes = getTopQuizzes(10);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUsage();
    } catch (error) {
      console.error("Failed to refresh usage data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all usage logs? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAllLogs();
    } catch (error) {
      console.error("Failed to delete logs:", error);
      alert("Failed to delete usage logs. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading usage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">
            OpenAI Usage
          </h1>
          <p className="text-slate-400">
            Track and analyze your API usage and costs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <ExportButton logs={logs} />
          <button
            onClick={handleDeleteAll}
            disabled={logs.length === 0 || isDeleting}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-rose-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${isDeleting ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isDeleting ? (
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              )}
            </svg>
            {isDeleting ? "Deleting..." : "Delete All"}
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangePicker selected={dateRange} onChange={setDateRange} />

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          }
          title="Total Requests"
          value={formatNumber(globalStats.totalRequests)}
          color="blue"
        />
        <StatsCard
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="Total Tokens"
          value={formatNumber(globalStats.totalTokens)}
          subtitle={`${formatNumber(globalStats.totalPromptTokens)} in / ${formatNumber(globalStats.totalCompletionTokens)} out`}
          color="purple"
        />
        <StatsCard
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          title="Total Cost"
          value={formatCurrency(globalStats.totalCostUSD)}
          color="green"
        />
        <StatsCard
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          title="Avg Cost per Request"
          value={
            globalStats.totalRequests > 0
              ? formatCurrency(
                  globalStats.totalCostUSD / globalStats.totalRequests
                )
              : "$0.00"
          }
          color="amber"
        />
      </div>

      {/* Operation Type Breakdown */}
      {globalStats.totalRequests > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Usage by Operation Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              Object.entries(globalStats.byOperationType) as [
                OperationType,
                { count: number; totalCost: number }
              ][]
            )
              .filter(([, stats]) => stats.count > 0)
              .sort((a, b) => b[1].totalCost - a[1].totalCost)
              .map(([operationType, stats]) => (
                <div
                  key={operationType}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">
                      {OPERATION_LABELS[operationType]}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(stats.totalCost)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatNumber(stats.count)} requests</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Top Quizzes Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Top Quizzes by Cost
        </h2>
        <QuizUsageTable
          quizzes={topQuizzes}
          onViewDetails={setSelectedQuiz}
        />
      </div>

      {/* Details Modal */}
      <UsageDetailsModal
        quiz={selectedQuiz}
        onClose={() => setSelectedQuiz(null)}
      />
    </div>
  );
}
