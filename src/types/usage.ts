import { Task } from "../QuestionsTypes";

/**
 * Type of operation that triggered OpenAI API usage
 */
export type OperationType =
  | "quiz_generation"
  | "open_answer_grading"
  | "hint_generation"
  | "explanation_generation"
  | "answer_generation"
  | "score_rubric_generation"
  | "chat_message"
  | "task_translation"
  | "metadata_translation";

/**
 * Individual usage log entry for a single API call
 */
export interface UsageLog {
  id: string; // "usage-{timestamp}-{random}"
  timestamp: number;
  quizId: string | null; // null for standalone operations (e.g., chat)
  quizTitle: string | null; // Denormalized for deleted quizzes
  operationType: OperationType;
  promptTokens: number; // From OpenAI response
  completionTokens: number; // From OpenAI response
  totalTokens: number;
  costUSD: number; // Calculated at logging time
  model: string; // "gpt-4o-mini"
}

/**
 * Global statistics across all usage
 */
export interface GlobalStats {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCostUSD: number;
  byOperationType: Record<
    OperationType,
    { count: number; totalCost: number }
  >;
}

/**
 * Per-quiz usage statistics
 */
export interface QuizUsageStats {
  quizId: string;
  quizTitle: string;
  totalRequests: number;
  totalCostUSD: number;
  totalTokens: number;
  byOperationType: Record<OperationType, number>; // count per operation type
  logs: UsageLog[]; // All logs for this quiz
}

/**
 * Date range filter options
 */
export enum DateRangeFilter {
  LAST_7_DAYS = "last_7_days",
  LAST_30_DAYS = "last_30_days",
  LAST_YEAR = "last_year",
  ALL_TIME = "all_time",
}

/**
 * Helper to generate a unique usage log ID
 */
export function generateUsageId(): string {
  return `usage-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
