import { useState, useMemo } from "react";
import { QuizUsageStats } from "../../types/usage";
import { formatCurrency, formatNumber } from "../../utils/formatters";

type SortField = "title" | "requests" | "tokens" | "cost";
type SortDirection = "asc" | "desc";

interface QuizUsageTableProps {
  quizzes: QuizUsageStats[];
  onViewDetails: (quiz: QuizUsageStats) => void;
}

export function QuizUsageTable({
  quizzes,
  onViewDetails,
}: QuizUsageTableProps) {
  const [sortField, setSortField] = useState<SortField>("cost");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedQuizzes = useMemo(() => {
    const sorted = [...quizzes].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.quizTitle.localeCompare(b.quizTitle);
          break;
        case "requests":
          comparison = a.totalRequests - b.totalRequests;
          break;
        case "tokens":
          comparison = a.totalTokens - b.totalTokens;
          break;
        case "cost":
          comparison = a.totalCostUSD - b.totalCostUSD;
          break;
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });

    return sorted;
  }, [quizzes, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortDirection === "asc" ? (
      <svg
        className="w-4 h-4 text-indigo-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-indigo-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  if (quizzes.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto text-slate-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-slate-300 mb-2">
          No Usage Data Yet
        </h3>
        <p className="text-slate-500">
          Start using the app to see usage statistics for your quizzes
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-medium text-slate-400">#</span>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("title")}
                  className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Quiz Title
                  <SortIcon field="title" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("requests")}
                  className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Requests
                  <SortIcon field="requests" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("tokens")}
                  className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Total Tokens
                  <SortIcon field="tokens" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("cost")}
                  className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Total Cost
                  <SortIcon field="cost" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="text-xs font-medium text-slate-400">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedQuizzes.map((quiz, index) => (
              <tr
                key={quiz.quizId}
                className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-slate-500">
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-slate-100">
                    {quiz.quizTitle}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-slate-300">
                    {formatNumber(quiz.totalRequests)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-slate-300">
                    {formatNumber(quiz.totalTokens)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-emerald-400">
                    {formatCurrency(quiz.totalCostUSD)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => onViewDetails(quiz)}
                    className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
