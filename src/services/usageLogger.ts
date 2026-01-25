import { UsageLog, OperationType, generateUsageId } from "../types/usage";
import { PRICING } from "./constants";
import { getUsageStorageProvider } from "./storage/UsageStorageProvider";

/**
 * Context information for tracking API usage
 */
export interface UsageContext {
  quizId?: string | null;
  quizTitle?: string | null;
  operationType: OperationType;
}

/**
 * Calculate cost in USD from token counts
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string = "gpt-4o-mini"
): number {
  const pricing = PRICING[model as keyof typeof PRICING];
  if (!pricing) {
    console.warn(`No pricing data for model: ${model}`);
    return 0;
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.inputCostPer1M;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputCostPer1M;

  return inputCost + outputCost;
}

/**
 * Log OpenAI API usage to IndexedDB
 *
 * IMPORTANT: This function uses silent failure - it will never throw errors
 * to avoid breaking app functionality if logging fails.
 */
export async function logUsage(
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  },
  context: UsageContext,
  model: string = "gpt-4o-mini"
): Promise<void> {
  try {
    const costUSD = calculateCost(usage.promptTokens, usage.completionTokens, model);

    const log: UsageLog = {
      id: generateUsageId(),
      timestamp: Date.now(),
      quizId: context.quizId ?? null,
      quizTitle: context.quizTitle ?? null,
      operationType: context.operationType,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      costUSD,
      model,
    };

    const storage = getUsageStorageProvider();
    await storage.saveLog(log);
  } catch (error) {
    // Silent failure - log the error but don't throw
    // This ensures that usage tracking never breaks app functionality
    console.error("Failed to log usage (silent failure):", error);
  }
}
