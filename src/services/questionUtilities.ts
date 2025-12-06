import { TRAILING_COMMA_REGEX } from './constants';

export function generateSingleMultipleDistribution(total: number): [number, number] {
  const singleAmount = Math.floor(Math.random() * (total + 1));
  const multipleAmount = total - singleAmount;
  return [singleAmount, multipleAmount];
}

export function correctTrailingComma(text: string): string {
  return text.replace(TRAILING_COMMA_REGEX, '$1');
}
