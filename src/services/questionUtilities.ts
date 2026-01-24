import { TRAILING_COMMA_REGEX } from './constants';

export function generateSingleMultipleDistribution(total: number): [number, number] {
  if (total === 1) {
    // With only 1 question, randomly pick single or multiple
    return Math.random() < 0.5 ? [1, 0] : [0, 1];
  }

  // Ensure we get at least 1 of each type for a true mix
  // Generate singleAmount between 1 and (total - 1) inclusive
  const singleAmount = Math.floor(Math.random() * (total - 1)) + 1;
  const multipleAmount = total - singleAmount;

  return [singleAmount, multipleAmount];
}

export function correctTrailingComma(text: string): string {
  return text.replace(TRAILING_COMMA_REGEX, '$1');
}
