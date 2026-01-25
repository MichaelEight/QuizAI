/**
 * Format a number as USD currency
 * @param amount - The amount in USD
 * @returns Formatted currency string (e.g., "$1.23")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Format a number with thousands separators
 * @param num - The number to format
 * @returns Formatted number string (e.g., "1,234,567")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a timestamp as a readable date
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a timestamp as a readable date and time
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted datetime string (e.g., "Jan 15, 2024, 3:45 PM")
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
