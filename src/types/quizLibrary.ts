import { Task } from '../QuestionsTypes';

/**
 * Saved quiz with metadata for the library
 */
export interface SavedQuiz {
  id: string;                    // UUID
  title: string;                 // Required
  description?: string;          // Optional
  teacher?: string;              // Optional
  subjectName?: string;          // Optional
  subjectCode?: string;          // Optional (e.g., "CS101")

  // Content
  tasks: Task[];                 // The questions
  sourceText: string;            // Always saved with quiz
  uploadedFileNames?: string[];  // Names only (not content - too large)

  // Stats (denormalized for display/filtering)
  closedQuestionCount: number;
  openQuestionCount: number;
  totalQuestionCount: number;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Data needed to create a new quiz (without auto-generated fields)
 */
export interface CreateQuizData {
  title: string;
  description?: string;
  teacher?: string;
  subjectName?: string;
  subjectCode?: string;
  tasks: Task[];
  sourceText: string;
  uploadedFileNames?: string[];
}

/**
 * Data for updating quiz metadata
 */
export interface UpdateQuizData {
  title?: string;
  description?: string;
  teacher?: string;
  subjectName?: string;
  subjectCode?: string;
}

/**
 * Sort options for library view
 */
export type SortField = 'title' | 'createdAt' | 'updatedAt' | 'totalQuestionCount';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Filter options for library view
 */
export interface FilterConfig {
  searchQuery?: string;
  subjectName?: string;
  subjectCode?: string;
}

/**
 * Abstract storage provider interface for future online expansion
 */
export interface IStorageProvider {
  // CRUD operations
  getAll(): Promise<SavedQuiz[]>;
  getById(id: string): Promise<SavedQuiz | null>;
  save(quiz: SavedQuiz): Promise<void>;
  update(id: string, data: UpdateQuizData): Promise<void>;
  delete(id: string): Promise<void>;

  // Bulk operations (useful for sync/export)
  importBulk(quizzes: SavedQuiz[]): Promise<void>;
  exportAll(): Promise<SavedQuiz[]>;

  // Initialization
  initialize(): Promise<void>;
}

/**
 * Helper to generate a unique ID
 */
export function generateQuizId(): string {
  return `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper to create a SavedQuiz from CreateQuizData
 */
export function createSavedQuiz(data: CreateQuizData): SavedQuiz {
  const now = Date.now();
  const closedCount = data.tasks.filter(t => !t.question.isOpen).length;
  const openCount = data.tasks.filter(t => t.question.isOpen).length;

  return {
    id: generateQuizId(),
    title: data.title,
    description: data.description,
    teacher: data.teacher,
    subjectName: data.subjectName,
    subjectCode: data.subjectCode,
    tasks: data.tasks,
    sourceText: data.sourceText,
    uploadedFileNames: data.uploadedFileNames,
    closedQuestionCount: closedCount,
    openQuestionCount: openCount,
    totalQuestionCount: data.tasks.length,
    createdAt: now,
    updatedAt: now,
  };
}
