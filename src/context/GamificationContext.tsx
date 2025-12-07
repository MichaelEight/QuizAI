import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  GamificationContextType,
  GamificationState,
  UserStats,
  QuizSessionStats,
  CelebrationEvent,
  Achievement,
  AchievementCheckContext,
  PointsBreakdown,
} from '../types/gamification';
import {
  createDefaultUserStats,
  createDefaultSessionStats,
  loadGamificationState,
  saveGamificationState,
  calculatePoints,
  calculateLearntBonus,
  calculateQuizCompleteBonus,
  checkAchievements,
  updateTimeStats,
} from '../services/gamificationService';

const GamificationContext = createContext<GamificationContextType | null>(null);

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}

interface GamificationProviderProps {
  children: React.ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  // Load persisted state or create defaults
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const loaded = loadGamificationState();
    return loaded?.userStats ?? createDefaultUserStats();
  });

  const [sessionStats, setSessionStats] = useState<QuizSessionStats>(createDefaultSessionStats);
  const [pendingCelebrations, setPendingCelebrations] = useState<CelebrationEvent[]>([]);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState<Achievement | null>(null);

  // Timer ref for accurate timing
  const timerStartRef = useRef<number | null>(null);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationEvent | null>(null);

  // Persist user stats on change
  useEffect(() => {
    saveGamificationState(userStats);
  }, [userStats]);

  // Check for time-based achievements on session start
  useEffect(() => {
    const newAchievements = checkAchievements(
      { type: 'session_start' },
      userStats,
      sessionStats
    );
    if (newAchievements.length > 0) {
      handleNewAchievements(newAchievements);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle new achievements
  const handleNewAchievements = useCallback((achievements: Achievement[]) => {
    if (achievements.length === 0) return;

    // Add points from achievements
    const achievementPoints = achievements.reduce((sum, a) => sum + a.points, 0);

    setUserStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + achievementPoints,
      unlockedAchievements: [
        ...prev.unlockedAchievements,
        ...achievements.map(a => ({ id: a.id, unlockedAt: Date.now() })),
      ],
    }));

    setSessionStats(prev => ({
      ...prev,
      sessionPoints: prev.sessionPoints + achievementPoints,
    }));

    // Queue achievements for display
    setPendingAchievements(prev => [...prev, ...achievements]);

    // Show first achievement modal
    if (!showAchievementModal) {
      setShowAchievementModal(achievements[0]);
    }

    // Trigger celebration
    achievements.forEach(achievement => {
      setPendingCelebrations(prev => [
        ...prev,
        { type: 'achievement', data: { achievement } },
      ]);
    });
  }, [showAchievementModal]);

  // Timer functions
  const startTimer = useCallback(() => {
    const now = Date.now();
    timerStartRef.current = now;
    setTimerStart(now);
    setIsTimerRunning(true);
    setSessionStats(prev => ({
      ...prev,
      timeStats: {
        ...prev.timeStats,
        questionStartTime: now,
      },
    }));
  }, []);

  const stopTimer = useCallback((): number => {
    const startTime = timerStartRef.current;
    if (!startTime) return 0;

    const elapsed = Date.now() - startTime;
    timerStartRef.current = null;
    setTimerStart(null);
    setIsTimerRunning(false);

    return elapsed;
  }, []);

  // Streak functions
  const incrementStreak = useCallback(() => {
    setSessionStats(prev => ({
      ...prev,
      sessionStreak: prev.sessionStreak + 1,
    }));

    setUserStats(prev => {
      const newStreak = prev.currentStreak + 1;
      return {
        ...prev,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        lastPlayedAt: Date.now(),
      };
    });
  }, []);

  const resetStreak = useCallback(() => {
    setSessionStats(prev => ({
      ...prev,
      sessionStreak: 0,
      fastAnswersInARow: 0,
    }));

    setUserStats(prev => ({
      ...prev,
      currentStreak: 0,
    }));
  }, []);

  // Points
  const addPoints = useCallback((points: number, _breakdown?: PointsBreakdown) => {
    if (points <= 0) return;

    setSessionStats(prev => ({
      ...prev,
      sessionPoints: prev.sessionPoints + points,
    }));

    setUserStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + points,
    }));

    // Trigger points celebration
    setPendingCelebrations(prev => [
      ...prev,
      { type: 'correct', data: { points } },
    ]);
  }, []);

  // Celebrations
  const triggerCelebration = useCallback((event: CelebrationEvent) => {
    setPendingCelebrations(prev => [...prev, event]);
    // Also set as current celebration for display
    setCurrentCelebration(event);
  }, []);

  const dismissCelebration = useCallback(() => {
    setPendingCelebrations(prev => prev.slice(1));
  }, []);

  const clearCelebration = useCallback(() => {
    setCurrentCelebration(null);
  }, []);

  // Achievements
  const checkAchievementsHandler = useCallback((context: AchievementCheckContext): Achievement[] => {
    const newAchievements = checkAchievements(context, userStats, sessionStats);
    if (newAchievements.length > 0) {
      handleNewAchievements(newAchievements);
    }
    return newAchievements;
  }, [userStats, sessionStats, handleNewAchievements]);

  const dismissAchievementModal = useCallback(() => {
    setShowAchievementModal(null);
    // Show next pending achievement if any
    setPendingAchievements(prev => {
      const remaining = prev.slice(1);
      if (remaining.length > 0) {
        setTimeout(() => setShowAchievementModal(remaining[0]), 300);
      }
      return remaining;
    });
  }, []);

  // Session management
  const resetSession = useCallback(() => {
    setSessionStats(createDefaultSessionStats());
    timerStartRef.current = null;
    setTimerStart(null);
    setIsTimerRunning(false);
    setCurrentCelebration(null);
  }, []);

  const endQuiz = useCallback((stats: { correct: number; incorrect: number; learnt: number }) => {
    const total = stats.correct + stats.incorrect;
    const accuracy = total > 0 ? (stats.correct / total) * 100 : 0;

    // Add quiz completion bonus
    const completionBonus = calculateQuizCompleteBonus(accuracy);
    addPoints(completionBonus);

    // Update user stats
    setUserStats(prev => ({
      ...prev,
      totalQuizzesCompleted: prev.totalQuizzesCompleted + 1,
      lastPlayedAt: Date.now(),
    }));

    // Check quiz completion achievements
    checkAchievementsHandler({
      type: 'quiz_complete',
      accuracy,
      totalQuestions: total,
      incorrectCount: stats.incorrect,
    });

    // Trigger quiz complete celebration
    triggerCelebration({ type: 'quiz_complete' });
  }, [addPoints, checkAchievementsHandler, triggerCelebration]);

  // Record answer (main entry point for quiz integration)
  const recordAnswer = useCallback((
    correct: boolean,
    timeMs: number,
    isRetry: boolean
  ): PointsBreakdown => {
    const currentStreak = correct ? sessionStats.sessionStreak + 1 : 0;
    const breakdown = calculatePoints(correct, timeMs, currentStreak, isRetry);

    // Update session stats
    setSessionStats(prev => {
      const newTimeStats = updateTimeStats(prev.timeStats, timeMs, correct);
      const isFastAnswer = timeMs < 5000 && correct;

      return {
        ...prev,
        sessionCorrect: prev.sessionCorrect + (correct ? 1 : 0),
        sessionIncorrect: prev.sessionIncorrect + (correct ? 0 : 1),
        questionsAnswered: prev.questionsAnswered + 1,
        fastAnswersInARow: isFastAnswer ? prev.fastAnswersInARow + 1 : 0,
        timeStats: newTimeStats,
      };
    });

    // Update user stats
    setUserStats(prev => {
      const newStats = {
        ...prev,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + 1,
        totalCorrectAnswers: prev.totalCorrectAnswers + (correct ? 1 : 0),
        totalIncorrectAnswers: prev.totalIncorrectAnswers + (correct ? 0 : 1),
        lastPlayedAt: Date.now(),
      };

      // Update best time for correct answers
      if (correct && (prev.allTimeBestTime === null || timeMs < prev.allTimeBestTime)) {
        newStats.allTimeBestTime = timeMs;
      }

      return newStats;
    });

    if (correct) {
      incrementStreak();
      addPoints(breakdown.total, breakdown);

      // Check answer-related achievements
      checkAchievementsHandler({
        type: 'answer',
        streak: currentStreak,
        timeMs,
      });
    } else {
      resetStreak();
    }

    return breakdown;
  }, [sessionStats.sessionStreak, incrementStreak, resetStreak, addPoints, checkAchievementsHandler]);

  // Record learnt question
  const recordLearntQuestion = useCallback(() => {
    const bonus = calculateLearntBonus();
    addPoints(bonus);

    // Trigger learnt celebration
    triggerCelebration({ type: 'learnt' });
  }, [addPoints, triggerCelebration]);

  const state: GamificationState = {
    userStats,
    sessionStats,
    pendingCelebrations,
    pendingAchievements,
    showAchievementModal,
    timerStart,
    isTimerRunning,
    currentCelebration,
  };

  const actions = {
    startTimer,
    stopTimer,
    incrementStreak,
    resetStreak,
    addPoints,
    triggerCelebration,
    dismissCelebration,
    clearCelebration,
    checkAchievements: checkAchievementsHandler,
    dismissAchievementModal,
    resetSession,
    endQuiz,
    recordAnswer,
    recordLearntQuestion,
  };

  return (
    <GamificationContext.Provider value={{ ...state, ...actions }}>
      {children}
    </GamificationContext.Provider>
  );
}
