import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  UsageLog,
  GlobalStats,
  QuizUsageStats,
  DateRangeFilter,
} from "../types/usage";
import { getUsageStorageProvider } from "../services/storage/UsageStorageProvider";
import {
  calculateGlobalStats,
  calculateQuizStats,
  getTopQuizzesByCost,
  filterLogsByDateRange,
} from "../services/usageAnalytics";

interface UsageContextType {
  // State
  logs: UsageLog[];
  globalStats: GlobalStats;
  quizStats: QuizUsageStats[];
  isLoading: boolean;
  dateRange: DateRangeFilter;

  // Operations
  setDateRange: (range: DateRangeFilter) => void;
  refreshUsage: () => Promise<void>;
  deleteAllLogs: () => Promise<void>;
  getTopQuizzes: (limit?: number) => QuizUsageStats[];
  getQuizStats: (quizId: string) => QuizUsageStats | null;
}

const UsageContext = createContext<UsageContextType | null>(null);

export function useUsage(): UsageContextType {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
}

interface UsageProviderProps {
  children: React.ReactNode;
}

export function UsageProvider({ children }: UsageProviderProps) {
  const [allLogs, setAllLogs] = useState<UsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeFilter>(
    DateRangeFilter.ALL_TIME
  );

  const storage = getUsageStorageProvider();

  // Load usage logs on mount
  const refreshUsage = useCallback(async () => {
    setIsLoading(true);
    try {
      const logs = await storage.getAllLogs();
      setAllLogs(logs);
    } catch (error) {
      console.error("Failed to load usage logs:", error);
      setAllLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    refreshUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delete all logs
  const deleteAllLogs = useCallback(async () => {
    try {
      await storage.deleteAllLogs();
      setAllLogs([]);
    } catch (error) {
      console.error("Failed to delete usage logs:", error);
      throw error;
    }
  }, [storage]);

  // Filter logs by selected date range
  const filteredLogs = useMemo(() => {
    return filterLogsByDateRange(allLogs, dateRange);
  }, [allLogs, dateRange]);

  // Calculate global stats from filtered logs
  const globalStats = useMemo(() => {
    return calculateGlobalStats(filteredLogs);
  }, [filteredLogs]);

  // Calculate per-quiz stats from filtered logs
  const quizStats = useMemo(() => {
    return calculateQuizStats(filteredLogs);
  }, [filteredLogs]);

  // Get top quizzes by cost
  const getTopQuizzes = useCallback(
    (limit: number = 10) => {
      return getTopQuizzesByCost(quizStats, limit);
    },
    [quizStats]
  );

  // Get stats for a specific quiz
  const getQuizStats = useCallback(
    (quizId: string): QuizUsageStats | null => {
      return quizStats.find((s) => s.quizId === quizId) ?? null;
    },
    [quizStats]
  );

  const value: UsageContextType = useMemo(
    () => ({
      logs: filteredLogs,
      globalStats,
      quizStats,
      isLoading,
      dateRange,
      setDateRange,
      refreshUsage,
      deleteAllLogs,
      getTopQuizzes,
      getQuizStats,
    }),
    [
      filteredLogs,
      globalStats,
      quizStats,
      isLoading,
      dateRange,
      refreshUsage,
      deleteAllLogs,
      getTopQuizzes,
      getQuizStats,
    ]
  );

  return (
    <UsageContext.Provider value={value}>{children}</UsageContext.Provider>
  );
}
