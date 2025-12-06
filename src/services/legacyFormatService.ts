import JSZip from 'jszip';
import { Task, Answer } from '../QuestionsTypes';

export interface ImportResult {
  tasks: Task[];
  errors: string[];
}

function generateId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse a legacy format file content into a Task
 * Format:
 *   Xdddd  (d = 0 or 1 for each answer)
 *   question text
 *   answer1
 *   answer2
 *   ...
 */
export function parseLegacyFile(content: string, _filename: string): Task | null {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return null;

  const header = lines[0].trim();
  if (!header.startsWith('X')) return null;

  const pattern = header.slice(1); // e.g., "01" or "0001"
  const question = lines[1].trim();
  const answers = lines.slice(2).map(line => line.trim()).filter(line => line.length > 0);

  // Single answer = open question
  const isOpen = answers.length === 1;

  if (isOpen) {
    return {
      id: generateId(),
      question: { value: question, isOpen: true },
      answers: null,
      answerOverride: {
        acceptedOpenAnswer: answers[0],
        overriddenAt: Date.now()
      }
    };
  } else {
    // Closed question - map pattern to answers
    const mappedAnswers: Answer[] = answers.map((value, i) => ({
      value,
      isCorrect: pattern[i] === '1',
      isSelected: false
    }));

    return {
      id: generateId(),
      question: { value: question, isOpen: false },
      answers: mappedAnswers
    };
  }
}

/**
 * Parse multiple legacy files
 */
export function parseLegacyFiles(files: { name: string; content: string }[]): ImportResult {
  const tasks: Task[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const task = parseLegacyFile(file.content, file.name);
      if (task) {
        tasks.push(task);
      } else {
        errors.push(`${file.name}: Invalid format`);
      }
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  return { tasks, errors };
}

/**
 * Parse JSON import (QuizAI native format)
 */
export function parseJsonImport(content: string): ImportResult {
  try {
    const data = JSON.parse(content);

    // Handle array of tasks directly
    if (Array.isArray(data)) {
      const tasks = data.map((item) => ({
        ...item,
        id: item.id || generateId()
      })) as Task[];
      return { tasks, errors: [] };
    }

    // Handle wrapped format { tasks: [...] }
    if (data.tasks && Array.isArray(data.tasks)) {
      const tasks = data.tasks.map((item: Task) => ({
        ...item,
        id: item.id || generateId()
      })) as Task[];
      return { tasks, errors: [] };
    }

    return { tasks: [], errors: ['Invalid JSON format: expected array of tasks'] };
  } catch (e) {
    return { tasks: [], errors: [`JSON parse error: ${e instanceof Error ? e.message : 'Unknown error'}`] };
  }
}

/**
 * Serialize a Task to legacy format
 */
export function serializeToLegacy(task: Task, openAnswer?: string): string {
  const question = task.question.value;

  if (task.question.isOpen) {
    // Use provided AI-generated answer or existing override
    const answer = openAnswer || task.answerOverride?.acceptedOpenAnswer || '';
    return `X1\n${question}\n${answer}`;
  } else {
    const pattern = task.answers?.map(a => a.isCorrect ? '1' : '0').join('') || '';
    const answerLines = task.answers?.map(a => a.value).join('\n') || '';
    return `X${pattern}\n${question}\n${answerLines}`;
  }
}

/**
 * Export tasks to JSON format
 */
export function exportToJson(tasks: Task[]): string {
  return JSON.stringify(tasks, null, 2);
}

/**
 * Export tasks to legacy ZIP format
 * @param tasks - Tasks to export
 * @param openAnswers - Map of task ID to AI-generated answer for open questions
 */
export async function exportToLegacyZip(
  tasks: Task[],
  openAnswers: Map<string, string>
): Promise<Blob> {
  const zip = new JSZip();

  tasks.forEach((task, index) => {
    const filename = String(index + 1).padStart(3, '0') + '.txt';
    const openAnswer = task.question.isOpen ? openAnswers.get(task.id) : undefined;
    const content = serializeToLegacy(task, openAnswer);
    zip.file(filename, content);
  });

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Download a file in the browser
 */
export function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: mimeType || 'text/plain' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
