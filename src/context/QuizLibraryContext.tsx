import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  SavedQuiz,
  CreateQuizData,
  UpdateQuizData,
  SortConfig,
  FilterConfig,
  createSavedQuiz,
  generateQuizId,
} from '../types/quizLibrary';
import { getDefaultStorageProvider } from '../services/storage/storageFactory';

interface QuizLibraryContextType {
  // State
  quizzes: SavedQuiz[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  saveQuiz: (data: CreateQuizData) => Promise<SavedQuiz>;
  updateQuiz: (id: string, data: UpdateQuizData) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  getQuizById: (id: string) => Promise<SavedQuiz | null>;
  duplicateQuiz: (id: string) => Promise<SavedQuiz>;

  // Refresh
  refreshQuizzes: () => Promise<void>;

  // Filtering and sorting (client-side for now)
  getFilteredQuizzes: (filter?: FilterConfig, sort?: SortConfig) => SavedQuiz[];
}

const QuizLibraryContext = createContext<QuizLibraryContextType | null>(null);

export function useQuizLibrary(): QuizLibraryContextType {
  const context = useContext(QuizLibraryContext);
  if (!context) {
    throw new Error('useQuizLibrary must be used within a QuizLibraryProvider');
  }
  return context;
}

interface QuizLibraryProviderProps {
  children: React.ReactNode;
}

export function QuizLibraryProvider({ children }: QuizLibraryProviderProps) {
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storage = getDefaultStorageProvider();

  // Load quizzes on mount
  useEffect(() => {
    refreshQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await storage.initialize();
      const allQuizzes = await storage.getAll();
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
      setError('Failed to load quiz library');
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  const saveQuiz = useCallback(async (data: CreateQuizData): Promise<SavedQuiz> => {
    setError(null);
    try {
      const quiz = createSavedQuiz(data);
      await storage.save(quiz);
      setQuizzes(prev => [...prev, quiz]);
      return quiz;
    } catch (err) {
      console.error('Failed to save quiz:', err);
      setError('Failed to save quiz');
      throw err;
    }
  }, [storage]);

  const updateQuiz = useCallback(async (id: string, data: UpdateQuizData): Promise<void> => {
    setError(null);
    try {
      await storage.update(id, data);
      setQuizzes(prev =>
        prev.map(q =>
          q.id === id
            ? { ...q, ...data, updatedAt: Date.now() }
            : q
        )
      );
    } catch (err) {
      console.error('Failed to update quiz:', err);
      setError('Failed to update quiz');
      throw err;
    }
  }, [storage]);

  const deleteQuiz = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await storage.delete(id);
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      setError('Failed to delete quiz');
      throw err;
    }
  }, [storage]);

  const getQuizById = useCallback(async (id: string): Promise<SavedQuiz | null> => {
    // Try to find in cached quizzes first
    const cached = quizzes.find(q => q.id === id);
    if (cached) return cached;

    // Otherwise fetch from storage
    try {
      return await storage.getById(id);
    } catch (err) {
      console.error('Failed to get quiz:', err);
      return null;
    }
  }, [quizzes, storage]);

  const duplicateQuiz = useCallback(async (id: string): Promise<SavedQuiz> => {
    const original = await getQuizById(id);
    if (!original) {
      throw new Error('Quiz not found');
    }

    const now = Date.now();
    const duplicate: SavedQuiz = {
      ...original,
      id: generateQuizId(),
      title: `${original.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    await storage.save(duplicate);
    setQuizzes(prev => [...prev, duplicate]);
    return duplicate;
  }, [getQuizById, storage]);

  const getFilteredQuizzes = useCallback((
    filter?: FilterConfig,
    sort?: SortConfig
  ): SavedQuiz[] => {
    let result = [...quizzes];

    // Apply filters
    if (filter) {
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        result = result.filter(q =>
          q.title.toLowerCase().includes(query) ||
          q.description?.toLowerCase().includes(query) ||
          q.subjectName?.toLowerCase().includes(query) ||
          q.subjectCode?.toLowerCase().includes(query) ||
          q.teacher?.toLowerCase().includes(query)
        );
      }

      if (filter.subjectName) {
        result = result.filter(q =>
          q.subjectName?.toLowerCase() === filter.subjectName?.toLowerCase()
        );
      }

      if (filter.subjectCode) {
        result = result.filter(q =>
          q.subjectCode?.toLowerCase() === filter.subjectCode?.toLowerCase()
        );
      }
    }

    // Apply sort
    if (sort) {
      result.sort((a, b) => {
        let comparison = 0;

        switch (sort.field) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'createdAt':
            comparison = a.createdAt - b.createdAt;
            break;
          case 'updatedAt':
            comparison = a.updatedAt - b.updatedAt;
            break;
          case 'totalQuestionCount':
            comparison = a.totalQuestionCount - b.totalQuestionCount;
            break;
        }

        return sort.direction === 'desc' ? -comparison : comparison;
      });
    } else {
      // Default: newest first
      result.sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }, [quizzes]);

  const value: QuizLibraryContextType = {
    quizzes,
    isLoading,
    error,
    saveQuiz,
    updateQuiz,
    deleteQuiz,
    getQuizById,
    duplicateQuiz,
    refreshQuizzes,
    getFilteredQuizzes,
  };

  return (
    <QuizLibraryContext.Provider value={value}>
      {children}
    </QuizLibraryContext.Provider>
  );
}
