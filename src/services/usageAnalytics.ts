import {
  UsageLog,
  GlobalStats,
  QuizUsageStats,
  OperationType,
  DateRangeFilter,
} from "../types/usage";

/**
 * Calculate global statistics from all usage logs
 */
export function calculateGlobalStats(logs: UsageLog[]): GlobalStats {
  const byOperationType: Record<
    OperationType,
    { count: number; totalCost: number }
  > = {
    quiz_generation: { count: 0, totalCost: 0 },
    open_answer_grading: { count: 0, totalCost: 0 },
    hint_generation: { count: 0, totalCost: 0 },
    explanation_generation: { count: 0, totalCost: 0 },
    answer_generation: { count: 0, totalCost: 0 },
    score_rubric_generation: { count: 0, totalCost: 0 },
    chat_message: { count: 0, totalCost: 0 },
    task_translation: { count: 0, totalCost: 0 },
    metadata_translation: { count: 0, totalCost: 0 },
  };

  let totalRequests = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalCostUSD = 0;

  for (const log of logs) {
    totalRequests++;
    totalPromptTokens += log.promptTokens;
    totalCompletionTokens += log.completionTokens;
    totalTokens += log.totalTokens;
    totalCostUSD += log.costUSD;

    byOperationType[log.operationType].count++;
    byOperationType[log.operationType].totalCost += log.costUSD;
  }

  return {
    totalRequests,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalCostUSD,
    byOperationType,
  };
}

/**
 * Calculate per-quiz usage statistics
 * @param logs - All usage logs
 * @returns Array of quiz statistics, excluding standalone operations (quizId: null)
 */
export function calculateQuizStats(logs: UsageLog[]): QuizUsageStats[] {
  // Group logs by quizId (exclude null quizIds - those are standalone operations)
  const logsByQuiz = new Map<string, UsageLog[]>();

  for (const log of logs) {
    if (log.quizId === null) continue; // Skip standalone operations

    if (!logsByQuiz.has(log.quizId)) {
      logsByQuiz.set(log.quizId, []);
    }
    logsByQuiz.get(log.quizId)!.push(log);
  }

  // Calculate stats for each quiz
  const quizStats: QuizUsageStats[] = [];

  for (const [quizId, quizLogs] of logsByQuiz) {
    // Use the most recent quizTitle (handles renamed quizzes)
    const sortedLogs = [...quizLogs].sort((a, b) => b.timestamp - a.timestamp);
    const quizTitle = sortedLogs[0].quizTitle || "Untitled Quiz";

    const byOperationType: Record<OperationType, number> = {
      quiz_generation: 0,
      open_answer_grading: 0,
      hint_generation: 0,
      explanation_generation: 0,
      answer_generation: 0,
      score_rubric_generation: 0,
      chat_message: 0,
      task_translation: 0,
      metadata_translation: 0,
    };

    let totalRequests = 0;
    let totalCostUSD = 0;
    let totalTokens = 0;

    for (const log of quizLogs) {
      totalRequests++;
      totalCostUSD += log.costUSD;
      totalTokens += log.totalTokens;
      byOperationType[log.operationType]++;
    }

    quizStats.push({
      quizId,
      quizTitle,
      totalRequests,
      totalCostUSD,
      totalTokens,
      byOperationType,
      logs: quizLogs,
    });
  }

  return quizStats;
}

/**
 * Get top N quizzes by cost
 */
export function getTopQuizzesByCost(
  stats: QuizUsageStats[],
  limit: number = 10
): QuizUsageStats[] {
  return [...stats].sort((a, b) => b.totalCostUSD - a.totalCostUSD).slice(0, limit);
}

/**
 * Filter logs by date range preset
 */
export function filterLogsByDateRange(
  logs: UsageLog[],
  filter: DateRangeFilter
): UsageLog[] {
  if (filter === DateRangeFilter.ALL_TIME) {
    return logs;
  }

  const now = Date.now();
  let cutoffTime: number;

  switch (filter) {
    case DateRangeFilter.LAST_7_DAYS:
      cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case DateRangeFilter.LAST_30_DAYS:
      cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
      break;
    case DateRangeFilter.LAST_YEAR:
      cutoffTime = now - 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      return logs;
  }

  return logs.filter((log) => log.timestamp >= cutoffTime);
}

/**
 * Export logs to CSV format
 */
export function exportLogsToCSV(logs: UsageLog[]): string {
  const headers = [
    "Timestamp",
    "Date",
    "Quiz ID",
    "Quiz Title",
    "Operation Type",
    "Prompt Tokens",
    "Completion Tokens",
    "Total Tokens",
    "Cost (USD)",
    "Model",
  ];

  const rows = logs.map((log) => [
    log.timestamp.toString(),
    new Date(log.timestamp).toISOString(),
    log.quizId || "N/A",
    log.quizTitle || "N/A",
    log.operationType,
    log.promptTokens.toString(),
    log.completionTokens.toString(),
    log.totalTokens.toString(),
    log.costUSD.toFixed(6),
    log.model,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Export logs to JSON format
 */
export function exportLogsToJSON(logs: UsageLog[]): string {
  return JSON.stringify(logs, null, 2);
}
