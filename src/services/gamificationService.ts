import {
  UserStats,
  QuizSessionStats,
  TimeStats,
  PointsBreakdown,
  Achievement,
  AchievementCheckContext,
  PersistedGamificationState,
} from '../types/gamification';
import { ACHIEVEMENTS, canUnlockAchievement } from '../data/achievements';

// Storage key
export const GAMIFICATION_STORAGE_KEY = 'quizai_gamification';

// Current schema version
const SCHEMA_VERSION = 1;

// Base points
const BASE_POINTS = {
  CORRECT_ANSWER: 10,
  RETRY_CORRECT: 5,
  LEARNT_QUESTION: 25,
  QUIZ_COMPLETE: 50,
};

// Time multipliers (seconds)
const TIME_THRESHOLDS = {
  LIGHTNING: 3,
  FAST: 5,
  GOOD: 10,
  NORMAL: 20,
};

const TIME_MULTIPLIERS = {
  LIGHTNING: 2.0,
  FAST: 1.5,
  GOOD: 1.2,
  NORMAL: 1.0,
  SLOW: 0.8,
};

// Streak multipliers
const STREAK_THRESHOLDS = [
  { threshold: 20, multiplier: 3.0 },
  { threshold: 10, multiplier: 2.0 },
  { threshold: 5, multiplier: 1.5 },
  { threshold: 3, multiplier: 1.25 },
];

// Default states
export function createDefaultUserStats(): UserStats {
  return {
    totalPoints: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalQuizzesCompleted: 0,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    totalIncorrectAnswers: 0,
    allTimeBestTime: null,
    unlockedAchievements: [],
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
}

export function createDefaultSessionStats(): QuizSessionStats {
  return {
    sessionStreak: 0,
    sessionPoints: 0,
    sessionCorrect: 0,
    sessionIncorrect: 0,
    questionsAnswered: 0,
    fastAnswersInARow: 0,
    timeStats: createDefaultTimeStats(),
  };
}

export function createDefaultTimeStats(): TimeStats {
  return {
    questionStartTime: null,
    lastQuestionTime: null,
    averageTime: 0,
    bestTime: null,
    totalQuizTime: 0,
    questionsTimedThisSession: 0,
  };
}

// Storage functions
export function loadGamificationState(): PersistedGamificationState | null {
  try {
    const stored = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PersistedGamificationState;
      // Version migration could happen here
      if (parsed.version === SCHEMA_VERSION) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading gamification state:', error);
  }
  return null;
}

export function saveGamificationState(userStats: UserStats): void {
  try {
    const state: PersistedGamificationState = {
      version: SCHEMA_VERSION,
      userStats,
    };
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving gamification state:', error);
  }
}

// Points calculation
export function calculatePoints(
  isCorrect: boolean,
  timeMs: number,
  streak: number,
  isRetry: boolean
): PointsBreakdown {
  if (!isCorrect) {
    return {
      base: 0,
      timeMultiplier: 1,
      streakMultiplier: 1,
      total: 0,
      bonusReasons: [],
    };
  }

  const base = isRetry ? BASE_POINTS.RETRY_CORRECT : BASE_POINTS.CORRECT_ANSWER;
  const bonusReasons: string[] = [];

  // Time multiplier
  const timeSeconds = timeMs / 1000;
  let timeMultiplier = TIME_MULTIPLIERS.SLOW;

  if (timeSeconds < TIME_THRESHOLDS.LIGHTNING) {
    timeMultiplier = TIME_MULTIPLIERS.LIGHTNING;
    bonusReasons.push('Lightning fast!');
  } else if (timeSeconds < TIME_THRESHOLDS.FAST) {
    timeMultiplier = TIME_MULTIPLIERS.FAST;
    bonusReasons.push('Quick answer!');
  } else if (timeSeconds < TIME_THRESHOLDS.GOOD) {
    timeMultiplier = TIME_MULTIPLIERS.GOOD;
    bonusReasons.push('Good pace');
  } else if (timeSeconds < TIME_THRESHOLDS.NORMAL) {
    timeMultiplier = TIME_MULTIPLIERS.NORMAL;
  }

  // Streak multiplier
  let streakMultiplier = 1.0;
  for (const { threshold, multiplier } of STREAK_THRESHOLDS) {
    if (streak >= threshold) {
      streakMultiplier = multiplier;
      bonusReasons.push(`${streak} streak!`);
      break;
    }
  }

  const total = Math.round(base * timeMultiplier * streakMultiplier);

  return {
    base,
    timeMultiplier,
    streakMultiplier,
    total,
    bonusReasons,
  };
}

export function calculateLearntBonus(): number {
  return BASE_POINTS.LEARNT_QUESTION;
}

export function calculateQuizCompleteBonus(accuracy: number): number {
  // Base + accuracy bonus (up to 2x for 100%)
  const bonus = BASE_POINTS.QUIZ_COMPLETE * (1 + accuracy / 100);
  return Math.round(bonus);
}

// Achievement checking
export function checkAchievements(
  context: AchievementCheckContext,
  userStats: UserStats,
  sessionStats: QuizSessionStats
): Achievement[] {
  const unlockedIds = userStats.unlockedAchievements.map(a => a.id);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!canUnlockAchievement(achievement, unlockedIds)) {
      continue;
    }

    const shouldUnlock = checkAchievementCondition(
      achievement,
      context,
      userStats,
      sessionStats
    );

    if (shouldUnlock) {
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

function checkAchievementCondition(
  achievement: Achievement,
  context: AchievementCheckContext,
  userStats: UserStats,
  sessionStats: QuizSessionStats
): boolean {
  const { type, streak, timeMs, totalLearnt, accuracy, totalQuestions, incorrectCount, isRetryMastered, retryCount } = context;

  switch (achievement.id) {
    // Milestone
    case 'first_correct':
      return type === 'answer' && userStats.totalCorrectAnswers === 0;
    case 'first_learnt':
      return type === 'learnt' && totalLearnt === 1;
    case 'first_quiz':
      return type === 'quiz_complete' && userStats.totalQuizzesCompleted === 0;

    // Streak
    case 'streak_3':
      return type === 'answer' && (streak ?? 0) >= 3;
    case 'streak_5':
      return type === 'answer' && (streak ?? 0) >= 5;
    case 'streak_10':
      return type === 'answer' && (streak ?? 0) >= 10;
    case 'streak_20':
      return type === 'answer' && (streak ?? 0) >= 20;

    // Speed
    case 'speed_5s':
      return type === 'answer' && (timeMs ?? Infinity) < 5000;
    case 'speed_3s':
      return type === 'answer' && (timeMs ?? Infinity) < 3000;
    case 'speed_streak':
      return type === 'answer' && sessionStats.fastAnswersInARow >= 5;

    // Mastery
    case 'master_5':
      return type === 'learnt' && (totalLearnt ?? 0) >= 5;
    case 'master_10':
      return type === 'learnt' && (totalLearnt ?? 0) >= 10;
    case 'master_25':
      return type === 'learnt' && (totalLearnt ?? 0) >= 25;
    case 'master_50':
      return type === 'learnt' && (totalLearnt ?? 0) >= 50;

    // Accuracy
    case 'perfect_5':
      return type === 'quiz_complete' && (accuracy ?? 0) === 100 && (totalQuestions ?? 0) >= 5;
    case 'perfect_10':
      return type === 'quiz_complete' && (accuracy ?? 0) === 100 && (totalQuestions ?? 0) >= 10;

    // Persistence
    case 'comeback':
      return type === 'learnt' && isRetryMastered === true && (retryCount ?? 0) >= 3;
    case 'never_give_up':
      return type === 'quiz_complete' && (incorrectCount ?? 0) >= 10;

    // Hidden - time based
    case 'night_owl': {
      const hour = new Date().getHours();
      return type === 'session_start' && hour >= 0 && hour < 4;
    }
    case 'early_bird': {
      const hour = new Date().getHours();
      return type === 'session_start' && hour >= 5 && hour < 7;
    }

    default:
      return false;
  }
}

// Time formatting
export function formatTime(ms: number): string {
  if (ms < 0) return '0.0s';

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatTimeShort(ms: number): string {
  const seconds = ms / 1000;
  return `${seconds.toFixed(1)}s`;
}

// Update time stats
export function updateTimeStats(
  currentStats: TimeStats,
  questionTimeMs: number,
  isCorrect: boolean
): TimeStats {
  const newStats = { ...currentStats };

  newStats.lastQuestionTime = questionTimeMs;
  newStats.totalQuizTime += questionTimeMs;
  newStats.questionsTimedThisSession += 1;

  // Update average
  const totalTimed = newStats.questionsTimedThisSession;
  newStats.averageTime =
    (newStats.averageTime * (totalTimed - 1) + questionTimeMs) / totalTimed;

  // Update best time (only for correct answers)
  if (isCorrect) {
    if (newStats.bestTime === null || questionTimeMs < newStats.bestTime) {
      newStats.bestTime = questionTimeMs;
    }
  }

  return newStats;
}
