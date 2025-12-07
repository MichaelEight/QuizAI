import { useState } from 'react';
import { useGamification } from './context/GamificationContext';
import { AchievementIcon } from './components/AchievementIcon';
import { AchievementModal } from './components/AchievementModal';
import { Achievement, AchievementCategory } from './types/gamification';
import { ACHIEVEMENTS, getAchievementsByCategory } from './data/achievements';
import { formatTime } from './services/gamificationService';

type TabType = 'achievements' | 'stats';

export default function AchievementsPage() {
  const gamification = useGamification();
  const { userStats } = gamification;
  const [activeTab, setActiveTab] = useState<TabType>('achievements');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const unlockedIds = new Set(userStats.unlockedAchievements.map(a => a.id));
  const unlockedCount = unlockedIds.size;
  const totalAchievements = ACHIEVEMENTS.length;
  const totalPossiblePoints = ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);

  const categories: { value: AchievementCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'milestone', label: 'Milestones' },
    { value: 'streak', label: 'Streaks' },
    { value: 'speed', label: 'Speed' },
    { value: 'mastery', label: 'Mastery' },
    { value: 'accuracy', label: 'Accuracy' },
    { value: 'persistence', label: 'Persistence' },
    { value: 'hidden', label: 'Hidden' },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? ACHIEVEMENTS
    : getAchievementsByCategory(selectedCategory);

  const accuracy = userStats.totalQuestionsAnswered > 0
    ? Math.round((userStats.totalCorrectAnswers / userStats.totalQuestionsAnswered) * 100)
    : 0;

  const getUnlockDate = (achievementId: string): string | null => {
    const unlocked = userStats.unlockedAchievements.find(a => a.id === achievementId);
    if (!unlocked) return null;
    return new Date(unlocked.unlockedAt).toLocaleDateString();
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Achievements</h1>
        <p className="text-slate-400">
          <span className="text-indigo-400 font-medium">{unlockedCount}</span> of {totalAchievements} unlocked
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'achievements'
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
            </svg>
            Achievements
          </span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'stats'
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Statistics
          </span>
        </button>
      </div>

      {activeTab === 'achievements' ? (
        <>
          {/* Category Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat.value
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(achievement => {
              const isUnlocked = unlockedIds.has(achievement.id);
              const unlockDate = getUnlockDate(achievement.id);
              const isHidden = achievement.isHidden && !isUnlocked;

              return (
                <button
                  key={achievement.id}
                  onClick={() => !isHidden && setSelectedAchievement(achievement)}
                  disabled={isHidden}
                  className={`
                    relative p-4 rounded-xl border text-left transition-all duration-200
                    ${isUnlocked
                      ? 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-750'
                      : isHidden
                      ? 'bg-slate-800/30 border-slate-800 cursor-not-allowed'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`shrink-0 ${!isUnlocked && !isHidden ? 'opacity-40 grayscale' : ''}`}>
                      {isHidden ? (
                        <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        <AchievementIcon
                          icon={achievement.icon}
                          colorScheme={achievement.colorScheme}
                          style={achievement.style}
                          size="md"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate ${isUnlocked ? 'text-slate-100' : isHidden ? 'text-slate-500' : 'text-slate-300'}`}>
                        {isHidden ? '???' : achievement.name}
                      </h3>
                      <p className={`text-sm mt-0.5 line-clamp-2 ${isUnlocked ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isHidden ? 'Keep playing to discover this achievement' : achievement.description}
                      </p>

                      {/* Points and tier */}
                      <div className="flex items-center gap-2 mt-2">
                        {!isHidden && (
                          <span className={`text-xs font-medium ${isUnlocked ? 'text-indigo-400' : 'text-slate-500'}`}>
                            +{achievement.points} pts
                          </span>
                        )}
                        {achievement.tier && !isHidden && (
                          <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                            achievement.tier === 'bronze' ? 'bg-amber-900/30 text-amber-600' :
                            achievement.tier === 'silver' ? 'bg-slate-600/30 text-slate-300' :
                            achievement.tier === 'gold' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-purple-500/20 text-purple-300'
                          }`}>
                            {achievement.tier}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unlocked badge */}
                  {isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Unlock date */}
                  {unlockDate && (
                    <p className="text-xs text-slate-500 mt-2">
                      Unlocked {unlockDate}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* Statistics Tab */
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-indigo-400">{userStats.totalPoints.toLocaleString()}</p>
              <p className="text-sm text-slate-400 mt-1">Total Points</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-400">{userStats.bestStreak}</p>
              <p className="text-sm text-slate-400 mt-1">Best Streak</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">{accuracy}%</p>
              <p className="text-sm text-slate-400 mt-1">Accuracy</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-400">{userStats.totalQuizzesCompleted}</p>
              <p className="text-sm text-slate-400 mt-1">Quizzes Completed</p>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Detailed Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Questions Answered</span>
                  <span className="text-slate-100 font-medium">{userStats.totalQuestionsAnswered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Correct Answers</span>
                  <span className="text-emerald-400 font-medium">{userStats.totalCorrectAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Incorrect Answers</span>
                  <span className="text-rose-400 font-medium">{userStats.totalIncorrectAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Streak</span>
                  <span className="text-amber-400 font-medium">{userStats.currentStreak}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Best Time</span>
                  <span className="text-cyan-400 font-medium">
                    {userStats.allTimeBestTime ? formatTime(userStats.allTimeBestTime) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Achievements Unlocked</span>
                  <span className="text-indigo-400 font-medium">{unlockedCount} / {totalAchievements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Achievement Points</span>
                  <span className="text-indigo-400 font-medium">
                    {userStats.unlockedAchievements.reduce((sum, a) => {
                      const achievement = ACHIEVEMENTS.find(ach => ach.id === a.id);
                      return sum + (achievement?.points || 0);
                    }, 0)} / {totalPossiblePoints}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member Since</span>
                  <span className="text-slate-100 font-medium">
                    {new Date(userStats.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Progress</h2>
            <div className="space-y-4">
              {/* Achievement Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Achievements</span>
                  <span className="text-slate-300">{Math.round((unlockedCount / totalAchievements) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${(unlockedCount / totalAchievements) * 100}%` }}
                  />
                </div>
              </div>

              {/* Accuracy Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Accuracy</span>
                  <span className="text-slate-300">{accuracy}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>

              {/* Points toward next milestone */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Points to Next Milestone</span>
                  <span className="text-slate-300">
                    {userStats.totalPoints.toLocaleString()} / {getNextMilestone(userStats.totalPoints).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${(userStats.totalPoints / getNextMilestone(userStats.totalPoints)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          {userStats.unlockedAchievements.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Recent Achievements</h2>
              <div className="space-y-3">
                {userStats.unlockedAchievements
                  .slice()
                  .sort((a, b) => b.unlockedAt - a.unlockedAt)
                  .slice(0, 5)
                  .map(unlocked => {
                    const achievement = ACHIEVEMENTS.find(a => a.id === unlocked.id);
                    if (!achievement) return null;
                    return (
                      <button
                        key={unlocked.id}
                        onClick={() => setSelectedAchievement(achievement)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <AchievementIcon
                          icon={achievement.icon}
                          colorScheme={achievement.colorScheme}
                          style={achievement.style}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-100 truncate">{achievement.name}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(unlocked.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm text-indigo-400 font-medium">+{achievement.points}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievement Modal */}
      <AchievementModal
        achievement={selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
}

function getNextMilestone(currentPoints: number): number {
  const milestones = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
  for (const milestone of milestones) {
    if (currentPoints < milestone) return milestone;
  }
  return Math.ceil(currentPoints / 10000) * 10000 + 10000;
}
