import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker path from local bundle
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export type FileType = 'txt' | 'pdf' | 'md' | 'csv' | 'json';

export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  content: string;
  size: number;
}

const SUPPORTED_EXTENSIONS = ['.txt', '.pdf', '.md', '.csv', '.json'] as const;

/**
 * Extract text content from a file
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // Text files
  if (fileName.endsWith('.txt')) {
    return await file.text();
  }

  // Markdown files
  if (fileName.endsWith('.md')) {
    return await extractMarkdownText(file);
  }

  // CSV files
  if (fileName.endsWith('.csv')) {
    return await extractCsvText(file);
  }

  // JSON files
  if (fileName.endsWith('.json')) {
    return await extractJsonText(file);
  }

  // PDF files (requires library)
  if (fileName.endsWith('.pdf')) {
    return await extractPdfText(file);
  }

  throw new Error(`Unsupported file type: ${file.name}. Supported: .txt, .pdf, .md, .csv, .json`);
}

/**
 * Extract text from PDF file using pdf.js
 */
async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if ('str' in item) {
          return item.str;
        }
        return '';
      })
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}

/**
 * Extract text from Markdown files
 * Note: Preserves markdown syntax as plain text
 * Could be enhanced to parse structure (headings, lists, etc.) later
 */
async function extractMarkdownText(file: File): Promise<string> {
  return await file.text();
}

/**
 * Extract text from CSV files
 * Converts CSV rows to readable text format
 */
async function extractCsvText(file: File): Promise<string> {
  const content = await file.text();
  // Convert CSV to readable format: each row on new line
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  return lines.join('\n');
}

/**
 * Extract text from JSON files
 * Pretty-prints JSON for readability
 */
async function extractJsonText(file: File): Promise<string> {
  const content = await file.text();
  try {
    // Try to parse and pretty-print
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch (err) {
    // If invalid JSON, return as-is
    console.warn('Failed to parse JSON, using raw content:', err);
    return content;
  }
}

/**
 * Get file type from filename
 */
export function getFileTypeFromName(fileName: string): FileType | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.txt')) return 'txt';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.md')) return 'md';
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.json')) return 'json';
  return null;
}

/**
 * Check if a file type is supported
 */
export function isSupportedFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
