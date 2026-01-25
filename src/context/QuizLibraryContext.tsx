import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  SavedQuiz,
  CreateQuizData,
  UpdateQuizData,
  SortConfig,
  FilterConfig,
  createSavedQuiz,
  generateQuizId,
} from "../types/quizLibrary";
import { getDefaultStorageProvider } from "../services/storage/storageFactory";
import {
  translateQuizTasks,
  translateQuizMetadata,
} from "../services/translationService";
import { QuizLanguage } from "../SettingsType";
import { Task } from "../QuestionsTypes";

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
  translateQuiz: (
    id: string,
    targetLanguage: QuizLanguage,
  ) => Promise<SavedQuiz>;

  // Translation helpers
  getTranslations: (quizId: string) => SavedQuiz[];

  // Grouping helpers
  getGroupMembers: (quizId: string) => SavedQuiz[];

  // Refresh
  refreshQuizzes: () => Promise<void>;

  // Filtering and sorting (client-side for now)
  getFilteredQuizzes: (filter?: FilterConfig, sort?: SortConfig) => SavedQuiz[];

  // Versioning
  updateQuizContent: (
    quizId: string,
    tasks: Task[],
    sourceText: string,
    uploadedFileNames?: string[],
  ) => Promise<void>;
  restoreBackup: (quizId: string) => Promise<void>;
  deleteBackup: (quizId: string) => Promise<void>;

  // Export/Import
  exportLibrary: () => Promise<SavedQuiz[]>;
  importLibrary: (quizzes: SavedQuiz[]) => Promise<void>;
}

const QuizLibraryContext = createContext<QuizLibraryContextType | null>(null);

export function useQuizLibrary(): QuizLibraryContextType {
  const context = useContext(QuizLibraryContext);
  if (!context) {
    throw new Error("useQuizLibrary must be used within a QuizLibraryProvider");
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
      console.error("Failed to load quizzes:", err);
      setError("Failed to load quiz library");
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  const saveQuiz = useCallback(
    async (data: CreateQuizData): Promise<SavedQuiz> => {
      setError(null);
      try {
        const quiz = createSavedQuiz(data);
        await storage.save(quiz);
        setQuizzes((prev) => [...prev, quiz]);
        return quiz;
      } catch (err) {
        console.error("Failed to save quiz:", err);
        setError("Failed to save quiz");
        throw err;
      }
    },
    [storage],
  );

  const updateQuiz = useCallback(
    async (id: string, data: UpdateQuizData): Promise<void> => {
      setError(null);
      try {
        await storage.update(id, data);
        setQuizzes((prev) =>
          prev.map((q) =>
            q.id === id ? { ...q, ...data, updatedAt: Date.now() } : q,
          ),
        );
      } catch (err) {
        console.error("Failed to update quiz:", err);
        setError("Failed to update quiz");
        throw err;
      }
    },
    [storage],
  );

  const deleteQuiz = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        await storage.delete(id);
        setQuizzes((prev) => prev.filter((q) => q.id !== id));
      } catch (err) {
        console.error("Failed to delete quiz:", err);
        setError("Failed to delete quiz");
        throw err;
      }
    },
    [storage],
  );

  const getQuizById = useCallback(
    async (id: string): Promise<SavedQuiz | null> => {
      // Try to find in cached quizzes first
      const cached = quizzes.find((q) => q.id === id);
      if (cached) return cached;

      // Otherwise fetch from storage
      try {
        return await storage.getById(id);
      } catch (err) {
        console.error("Failed to get quiz:", err);
        return null;
      }
    },
    [quizzes, storage],
  );

  const duplicateQuiz = useCallback(
    async (id: string): Promise<SavedQuiz> => {
      const original = await getQuizById(id);
      if (!original) {
        throw new Error("Quiz not found");
      }

      const now = Date.now();
      const newId = generateQuizId();
      const duplicate: SavedQuiz = {
        ...original,
        id: newId,
        title: `${original.title} (Copy)`,
        groupId: newId, // New group for duplicate
        version: 1, // Reset version
        originalQuizId: undefined, // Not a translation
        previousVersionId: undefined, // No backup
        isBackup: false,
        createdAt: now,
        updatedAt: now,
      };

      await storage.save(duplicate);
      setQuizzes((prev) => [...prev, duplicate]);
      return duplicate;
    },
    [getQuizById, storage],
  );

  const translateQuiz = useCallback(
    async (id: string, targetLanguage: QuizLanguage): Promise<SavedQuiz> => {
      const original = await getQuizById(id);
      if (!original) {
        throw new Error("Quiz not found");
      }

      // Translate tasks with source text context for accuracy
      const translatedTasks = await translateQuizTasks(
        original.tasks,
        targetLanguage,
        original.sourceText,
      );

      // Translate metadata
      const translatedMeta = await translateQuizMetadata(
        original.title,
        original.description,
        targetLanguage,
      );

      // Determine the original quiz ID for linking translations
      const rootQuizId = original.originalQuizId || original.id;

      // Preserve groupId
      const groupId = original.groupId || rootQuizId;

      const now = Date.now();
      const translatedQuiz: SavedQuiz = {
        ...original,
        id: generateQuizId(),
        title: translatedMeta.title,
        description: translatedMeta.description,
        language: targetLanguage,
        originalQuizId: rootQuizId,
        groupId, // Preserve group
        tasks: translatedTasks,
        version: 1, // Reset version for translation
        createdAt: now,
        updatedAt: now,
      };

      await storage.save(translatedQuiz);
      setQuizzes((prev) => [...prev, translatedQuiz]);
      return translatedQuiz;
    },
    [getQuizById, storage],
  );

  const getTranslations = useCallback(
    (quizId: string): SavedQuiz[] => {
      // Find the quiz
      const quiz = quizzes.find((q) => q.id === quizId);
      if (!quiz) return [];

      // Determine the root quiz ID
      const rootId = quiz.originalQuizId || quiz.id;

      // Find all quizzes that share the same root (including the root itself)
      return quizzes.filter(
        (q) => q.id === rootId || q.originalQuizId === rootId,
      );
    },
    [quizzes],
  );

  const getGroupMembers = useCallback(
    (quizId: string): SavedQuiz[] => {
      const quiz = quizzes.find((q) => q.id === quizId);
      if (!quiz) return [];

      // Determine the group ID
      const groupId = quiz.groupId || quiz.originalQuizId || quiz.id;

      // Return all non-backup quizzes in the same group
      return quizzes.filter(
        (q) =>
          !q.isBackup &&
          (q.groupId === groupId ||
            q.id === groupId ||
            q.originalQuizId === groupId),
      );
    },
    [quizzes],
  );

  const getFilteredQuizzes = useCallback(
    (filter?: FilterConfig, sort?: SortConfig): SavedQuiz[] => {
      // Filter out backup versions
      let result = quizzes.filter((q) => !q.isBackup);

      // Apply filters
      if (filter) {
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          result = result.filter(
            (q) =>
              q.title.toLowerCase().includes(query) ||
              q.description?.toLowerCase().includes(query) ||
              q.subjectName?.toLowerCase().includes(query) ||
              q.subjectCode?.toLowerCase().includes(query) ||
              q.teacher?.toLowerCase().includes(query),
          );
        }

        if (filter.subjectName) {
          result = result.filter(
            (q) =>
              q.subjectName?.toLowerCase() ===
              filter.subjectName?.toLowerCase(),
          );
        }

        if (filter.subjectCode) {
          result = result.filter(
            (q) =>
              q.subjectCode?.toLowerCase() ===
              filter.subjectCode?.toLowerCase(),
          );
        }
      }

      // Apply sort
      if (sort) {
        result.sort((a, b) => {
          let comparison = 0;

          switch (sort.field) {
            case "title":
              comparison = a.title.localeCompare(b.title);
              break;
            case "createdAt":
              comparison = a.createdAt - b.createdAt;
              break;
            case "updatedAt":
              comparison = a.updatedAt - b.updatedAt;
              break;
            case "totalQuestionCount":
              comparison = a.totalQuestionCount - b.totalQuestionCount;
              break;
          }

          return sort.direction === "desc" ? -comparison : comparison;
        });
      } else {
        // Default: newest first
        result.sort((a, b) => b.createdAt - a.createdAt);
      }

      return result;
    },
    [quizzes],
  );

  const updateQuizContent = useCallback(
    async (
      quizId: string,
      tasks: Task[],
      sourceText: string,
      uploadedFileNames?: string[],
    ): Promise<void> => {
      setError(null);
      try {
        const existing = await storage.getById(quizId);
        if (!existing) {
          throw new Error("Quiz not found");
        }

        // Preserve metadata, update content
        const newQuizData: SavedQuiz = {
          ...existing,
          tasks,
          sourceText,
          uploadedFileNames,
          closedQuestionCount: tasks.filter((t) => !t.question.isOpen).length,
          openQuestionCount: tasks.filter((t) => t.question.isOpen).length,
          totalQuestionCount: tasks.length,
        };

        await storage.saveNewVersion(quizId, newQuizData);
        await refreshQuizzes();
      } catch (err) {
        console.error("Failed to update quiz content:", err);
        setError("Failed to update quiz content");
        throw err;
      }
    },
    [storage, refreshQuizzes],
  );

  const restoreBackup = useCallback(
    async (quizId: string): Promise<void> => {
      setError(null);
      try {
        await storage.restoreBackupVersion(quizId);
        await refreshQuizzes();
      } catch (err) {
        console.error("Failed to restore backup:", err);
        setError("Failed to restore backup");
        throw err;
      }
    },
    [storage, refreshQuizzes],
  );

  const deleteBackup = useCallback(
    async (quizId: string): Promise<void> => {
      setError(null);
      try {
        await storage.deleteBackup(quizId);
        await refreshQuizzes();
      } catch (err) {
        console.error("Failed to delete backup:", err);
        setError("Failed to delete backup");
        throw err;
      }
    },
    [storage, refreshQuizzes],
  );

  const exportLibrary = useCallback(async (): Promise<SavedQuiz[]> => {
    setError(null);
    try {
      const allQuizzes = await storage.exportAll();
      // Filter out backup versions - only export current versions
      const currentVersions = allQuizzes.filter((q) => !q.isBackup);
      return currentVersions;
    } catch (err) {
      console.error("Failed to export library:", err);
      setError("Failed to export library");
      throw err;
    }
  }, [storage]);

  const importLibrary = useCallback(
    async (quizzes: SavedQuiz[]): Promise<void> => {
      setError(null);
      try {
        // Sanitize imported quizzes:
        // - Generate new IDs to avoid conflicts
        // - Remove previousVersionId (don't import backup chain)
        // - Preserve version number if present, otherwise default to 1
        // - Remove isBackup flag
        const sanitized = quizzes.map((quiz) => ({
          ...quiz,
          id: generateQuizId(),
          previousVersionId: undefined,
          isBackup: false,
          version: quiz.version || 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));

        await storage.importBulk(sanitized);
        await refreshQuizzes();
      } catch (err) {
        console.error("Failed to import library:", err);
        setError("Failed to import library");
        throw err;
      }
    },
    [storage, refreshQuizzes],
  );

  const value: QuizLibraryContextType = useMemo(
    () => ({
      quizzes,
      isLoading,
      error,
      saveQuiz,
      updateQuiz,
      deleteQuiz,
      getQuizById,
      duplicateQuiz,
      translateQuiz,
      getTranslations,
      getGroupMembers,
      refreshQuizzes,
      getFilteredQuizzes,
      updateQuizContent,
      restoreBackup,
      deleteBackup,
      exportLibrary,
      importLibrary,
    }),
    [
      quizzes,
      isLoading,
      error,
      saveQuiz,
      updateQuiz,
      deleteQuiz,
      getQuizById,
      duplicateQuiz,
      translateQuiz,
      getTranslations,
      getGroupMembers,
      refreshQuizzes,
      getFilteredQuizzes,
      updateQuizContent,
      restoreBackup,
      deleteBackup,
      exportLibrary,
      importLibrary,
    ],
  );

  return (
    <QuizLibraryContext.Provider value={value}>
      {children}
    </QuizLibraryContext.Provider>
  );
}
