import { encode } from 'gpt-tokenizer';
import { getSysPrompt } from './promptService';
import { PromptTypes, QuestionTypes } from './constants';
import { ContentFocus, DifficultyLevel } from '../SettingsType';

// gpt-4o-mini context window limit
export const TOKEN_LIMIT = 128_000;

// Reserve tokens for output (questions generated)
const OUTPUT_RESERVE = 2_000;

/**
 * Count tokens in text using GPT tokenizer
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}

/**
 * Format numbers with spaces for readability (e.g., 149195 -> "149 195")
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Estimate API cost based on gpt-4o-mini pricing
 * Input: $0.15 per 1M tokens
 */
export function estimateCost(tokens: number): string {
  const cost = (tokens / 1_000_000) * 0.15;
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
  customInstructions: string = ''
): number {
  const systemTokens = getSystemPromptTokens(contentFocus, difficultyLevel, customInstructions);
  return TOKEN_LIMIT - systemTokens - OUTPUT_RESERVE;
}
