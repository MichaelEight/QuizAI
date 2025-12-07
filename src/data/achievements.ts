import { Achievement, AchievementCategory } from '../types/gamification';

export const ACHIEVEMENTS: Achievement[] = [
  // === MILESTONE ACHIEVEMENTS ===
  {
    id: 'first_correct',
    name: 'First Steps',
    description: 'Answer your first question correctly',
    category: 'milestone',
    style: 'standard',
    icon: 'star',
    colorScheme: 'emerald',
    points: 10,
  },
  {
    id: 'first_learnt',
    name: 'Knowledge Keeper',
    description: 'Master your first question',
    category: 'milestone',
    style: 'standard',
    icon: 'book',
    colorScheme: 'indigo',
    points: 25,
  },
  {
    id: 'first_quiz',
    name: 'Finisher',
    description: 'Complete your first quiz',
    category: 'milestone',
    style: 'standard',
    icon: 'flag',
    colorScheme: 'emerald',
    points: 50,
  },

  // === STREAK ACHIEVEMENTS (Tiered) ===
  {
    id: 'streak_3',
    name: 'Getting Warmed Up',
    description: 'Answer 3 questions correctly in a row',
    category: 'streak',
    tier: 'bronze',
    style: 'standard',
    icon: 'fire',
    colorScheme: 'amber',
    points: 15,
  },
  {
    id: 'streak_5',
    name: 'On Fire',
    description: 'Answer 5 questions correctly in a row',
    category: 'streak',
    tier: 'silver',
    style: 'rare',
    icon: 'fire',
    colorScheme: 'amber',
    prerequisiteId: 'streak_3',
    points: 30,
  },
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Answer 10 questions correctly in a row',
    category: 'streak',
    tier: 'gold',
    style: 'epic',
    icon: 'lightning',
    colorScheme: 'amber',
    prerequisiteId: 'streak_5',
    points: 75,
  },
  {
    id: 'streak_20',
    name: 'Legendary Mind',
    description: 'Answer 20 questions correctly in a row',
    category: 'streak',
    tier: 'platinum',
    style: 'legendary',
    icon: 'crown',
    colorScheme: 'purple',
    prerequisiteId: 'streak_10',
    points: 200,
  },

  // === SPEED ACHIEVEMENTS ===
  {
    id: 'speed_5s',
    name: 'Quick Thinker',
    description: 'Answer correctly in under 5 seconds',
    category: 'speed',
    style: 'standard',
    icon: 'clock',
    colorScheme: 'cyan',
    points: 20,
  },
  {
    id: 'speed_3s',
    name: 'Speed Demon',
    description: 'Answer correctly in under 3 seconds',
    category: 'speed',
    style: 'rare',
    icon: 'bolt',
    colorScheme: 'cyan',
    prerequisiteId: 'speed_5s',
    points: 50,
  },
  {
    id: 'speed_streak',
    name: 'Rapid Fire',
    description: 'Answer 5 questions in a row, each under 5 seconds',
    category: 'speed',
    style: 'epic',
    icon: 'lightning',
    colorScheme: 'cyan',
    points: 100,
  },

  // === MASTERY ACHIEVEMENTS (Tiered) ===
  {
    id: 'master_5',
    name: 'Budding Scholar',
    description: 'Master 5 questions',
    category: 'mastery',
    tier: 'bronze',
    style: 'standard',
    icon: 'graduation',
    colorScheme: 'indigo',
    points: 25,
  },
  {
    id: 'master_10',
    name: 'Dedicated Learner',
    description: 'Master 10 questions',
    category: 'mastery',
    tier: 'silver',
    style: 'rare',
    icon: 'graduation',
    colorScheme: 'indigo',
    prerequisiteId: 'master_5',
    points: 50,
  },
  {
    id: 'master_25',
    name: 'Knowledge Master',
    description: 'Master 25 questions',
    category: 'mastery',
    tier: 'gold',
    style: 'epic',
    icon: 'brain',
    colorScheme: 'indigo',
    prerequisiteId: 'master_10',
    points: 150,
  },
  {
    id: 'master_50',
    name: 'Sage',
    description: 'Master 50 questions',
    category: 'mastery',
    tier: 'platinum',
    style: 'legendary',
    icon: 'trophy',
    colorScheme: 'purple',
    prerequisiteId: 'master_25',
    points: 300,
  },

  // === ACCURACY ACHIEVEMENTS ===
  {
    id: 'perfect_5',
    name: 'Perfect Run',
    description: 'Complete a quiz with 100% accuracy (5+ questions)',
    category: 'accuracy',
    style: 'rare',
    icon: 'target',
    colorScheme: 'emerald',
    points: 75,
  },
  {
    id: 'perfect_10',
    name: 'Flawless Victory',
    description: 'Complete a quiz with 100% accuracy (10+ questions)',
    category: 'accuracy',
    style: 'epic',
    icon: 'diamond',
    colorScheme: 'emerald',
    prerequisiteId: 'perfect_5',
    points: 150,
  },

  // === PERSISTENCE ACHIEVEMENTS ===
  {
    id: 'comeback',
    name: 'Comeback Kid',
    description: 'Master a question after failing it 3+ times',
    category: 'persistence',
    style: 'rare',
    icon: 'refresh',
    colorScheme: 'rose',
    points: 40,
  },
  {
    id: 'never_give_up',
    name: 'Never Give Up',
    description: 'Complete a quiz after 10+ incorrect answers',
    category: 'persistence',
    style: 'rare',
    icon: 'heart',
    colorScheme: 'rose',
    points: 60,
  },

  // === HIDDEN ACHIEVEMENTS ===
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Study between midnight and 4 AM',
    category: 'hidden',
    style: 'rare',
    icon: 'moon',
    colorScheme: 'purple',
    isHidden: true,
    points: 35,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Study between 5 AM and 7 AM',
    category: 'hidden',
    style: 'rare',
    icon: 'sun',
    colorScheme: 'amber',
    isHidden: true,
    points: 35,
  },
];

// Helper functions
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

export function getVisibleAchievements(unlockedIds: string[]): Achievement[] {
  return ACHIEVEMENTS.filter(a => !a.isHidden || unlockedIds.includes(a.id));
}

export function isAchievementUnlocked(id: string, unlockedIds: string[]): boolean {
  return unlockedIds.includes(id);
}

export function canUnlockAchievement(achievement: Achievement, unlockedIds: string[]): boolean {
  // Already unlocked
  if (unlockedIds.includes(achievement.id)) {
    return false;
  }
  // Check prerequisite
  if (achievement.prerequisiteId && !unlockedIds.includes(achievement.prerequisiteId)) {
    return false;
  }
  return true;
}
