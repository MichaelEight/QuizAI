import { encode } from 'gpt-tokenizer';

// gpt-4o-mini context window limit
export const TOKEN_LIMIT = 128_000;

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
