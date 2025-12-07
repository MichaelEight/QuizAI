// Achievement categories for organization
export type AchievementCategory =
  | 'streak'
  | 'speed'
  | 'mastery'
  | 'accuracy'
  | 'persistence'
  | 'milestone'
  | 'hidden';

// Achievement tier for tiered achievements
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// Visual style variants for achievement display
export type AchievementStyle = 'standard' | 'rare' | 'epic' | 'legendary';

// Color schemes matching the app's design language
export type AchievementColor = 'emerald' | 'amber' | 'indigo' | 'rose' | 'purple' | 'cyan';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier?: AchievementTier;
  style: AchievementStyle;
  icon: string;
  colorScheme: AchievementColor;
  unlockedAt?: number;
  isHidden?: boolean;
  prerequisiteId?: string;
  points: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}

// Timer statistics
export interface TimeStats {
  questionStartTime: number | null;
  lastQuestionTime: number | null;
  averageTime: number;
  bestTime: number | null;
  totalQuizTime: number;
  questionsTimedThisSession: number;
}

// Session-specific state (reset each quiz)
export interface QuizSessionStats {
  sessionStreak: number;
  sessionPoints: number;
  sessionCorrect: number;
  sessionIncorrect: number;
  questionsAnswered: number;
  fastAnswersInARow: number; // For speed_streak achievement
  timeStats: TimeStats;
}

// Overall user statistics persisted across sessions
export interface UserStats {
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  totalQuizzesCompleted: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  allTimeBestTime: number | null;
  unlockedAchievements: UnlockedAchievement[];
  createdAt: number;
  lastPlayedAt: number;
}

// Persisted state structure
export interface PersistedGamificationState {
  version: number;
  userStats: UserStats;
}

// Celebration event types
export type CelebrationType =
  | 'correct'
  | 'learnt'
  | 'streak'
  | 'achievement'
  | 'quiz_complete';

export interface CelebrationEvent {
  type: CelebrationType;
  data?: {
    streak?: number;
    achievement?: Achievement;
    points?: number;
    questionId?: string;
  };
}

// Points multiplier for display
export interface PointsBreakdown {
  base: number;
  timeMultiplier: number;
  streakMultiplier: number;
  total: number;
  bonusReasons: string[];
}

// Context state
export interface GamificationState {
  userStats: UserStats;
  sessionStats: QuizSessionStats;
  pendingCelebrations: CelebrationEvent[];
  pendingAchievements: Achievement[];
  showAchievementModal: Achievement | null;
  // Timer state for UI
  timerStart: number | null;
  isTimerRunning: boolean;
  // Current celebration for display
  currentCelebration: CelebrationEvent | null;
}

// Context actions
export interface GamificationActions {
  // Timer
  startTimer: () => void;
  stopTimer: () => number; // Returns elapsed time in ms

  // Streak
  incrementStreak: () => void;
  resetStreak: () => void;

  // Points
  addPoints: (points: number, breakdown?: PointsBreakdown) => void;

  // Celebrations
  triggerCelebration: (event: CelebrationEvent) => void;
  dismissCelebration: () => void;
  clearCelebration: () => void;

  // Achievements
  checkAchievements: (context: AchievementCheckContext) => Achievement[];
  dismissAchievementModal: () => void;

  // Session
  resetSession: () => void;
  endQuiz: (stats: { correct: number; incorrect: number; learnt: number }) => void;

  // Stats
  recordAnswer: (correct: boolean, timeMs: number, isRetry: boolean) => PointsBreakdown;
  recordLearntQuestion: () => void;
}

// Context for checking achievements
export interface AchievementCheckContext {
  type: 'answer' | 'learnt' | 'quiz_complete' | 'session_start';
  streak?: number;
  timeMs?: number;
  totalLearnt?: number;
  accuracy?: number;
  totalQuestions?: number;
  incorrectCount?: number;
  isRetryMastered?: boolean;
  retryCount?: number;
}

// Full context type
export interface GamificationContextType extends GamificationState, GamificationActions {}
