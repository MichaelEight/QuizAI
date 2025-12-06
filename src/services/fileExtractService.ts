import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker path from local bundle
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface UploadedFile {
  id: string;
  name: string;
  type: 'txt' | 'pdf';
  content: string;
  size: number;
}

/**
 * Extract text content from a file
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.txt')) {
    return await file.text();
  }

  if (fileName.endsWith('.pdf')) {
    return await extractPdfText(file);
  }

  throw new Error(`Unsupported file type: ${file.name}`);
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
 * Check if a file type is supported
 */
export function isSupportedFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.txt') || fileName.endsWith('.pdf');
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
