import { getSysPrompt } from './promptService';
import { PromptTypes, QuestionTypes, MODELS, DEFAULT_MODEL, ModelId } from './constants';
import { ContentFocus, DifficultyLevel } from '../SettingsType';

// Default context window (fallback) — gpt-4o-mini
export const TOKEN_LIMIT = MODELS[DEFAULT_MODEL].contextWindow;

// Reserve tokens for output (questions generated)
const OUTPUT_RESERVE = 2_000;

/** Context window for a given model, falling back to the default model. */
function getContextWindow(model: ModelId = DEFAULT_MODEL): number {
  return MODELS[model]?.contextWindow ?? MODELS[DEFAULT_MODEL].contextWindow;
}

/**
 * Estimate tokens in text using character-based approximation
 * Rule of thumb: ~4 characters per token for English text
 * This is slightly conservative to avoid underestimating
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  // ~4 characters per token, rounded up to be conservative
  return Math.ceil(text.length / 4);
}

/**
 * Format numbers with spaces for readability (e.g., 149195 -> "149 195")
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Estimate API input cost for the source text based on the selected model's
 * standard (short-context) input price.
 */
export function estimateCost(tokens: number, model: ModelId = DEFAULT_MODEL): string {
  const inputCostPer1M = MODELS[model]?.inputCostPer1M ?? MODELS[DEFAULT_MODEL].inputCostPer1M;
  const cost = (tokens / 1_000_000) * inputCostPer1M;
  if (cost < 0.001) return '<$0.001';
  return `~$${cost.toFixed(3)}`;
}

/**
 * Calculate system prompt tokens based on settings
 * This estimates the worst-case (longest) system prompt
 */
export function getSystemPromptTokens(
  contentFocus: ContentFocus = 'important',
  difficultyLevel: DifficultyLevel = 'mixed',
  customInstructions: string = ''
): number {
  // Get the system prompt for the most token-heavy question type (closed with multiple answers)
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_QUESTIONS, {
    questionsAmount: 10, // Max questions
    typeOfQuestion: QuestionTypes.CLOSED_MULTI,
    contentFocus,
    difficultyLevel,
    customInstructions,
  });

  return countTokens(sysPrompt);
}

/**
 * Calculate available tokens for user content
 */
export function getAvailableTokens(
  contentFocus: ContentFocus = 'important',
  difficultyLevel: DifficultyLevel = 'mixed',
  customInstructions: string = '',
  model: ModelId = DEFAULT_MODEL
): number {
  const systemTokens = getSystemPromptTokens(contentFocus, difficultyLevel, customInstructions);
  return getContextWindow(model) - systemTokens - OUTPUT_RESERVE;
}
