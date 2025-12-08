import { useEffect } from 'react';
import { Achievement } from '../types/gamification';
import { AchievementIcon } from './AchievementIcon';

interface AchievementModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (achievement) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  const getBackgroundStyle = () => {
    switch (achievement.style) {
      case 'legendary':
        return 'bg-gradient-to-br from-purple-900/50 via-slate-800 to-indigo-900/50';
      case 'epic':
        return 'bg-gradient-to-br from-indigo-900/30 via-slate-800 to-purple-900/30';
      case 'rare':
        return 'bg-slate-800';
      default:
        return 'bg-slate-800';
    }
  };

  const getBorderStyle = () => {
    switch (achievement.style) {
      case 'legendary':
        return 'border-2 border-purple-500/50';
      case 'epic':
        return 'border-2 border-indigo-500/40';
      case 'rare':
        return 'border border-cyan-500/30';
      default:
        return 'border border-slate-700';
    }
  };

  const getTierLabel = () => {
    if (!achievement.tier) return null;
    const labels = {
      bronze: { text: 'Bronze', color: 'text-amber-600' },
      silver: { text: 'Silver', color: 'text-slate-300' },
      gold: { text: 'Gold', color: 'text-amber-400' },
      platinum: { text: 'Platinum', color: 'text-purple-300' },
    };
    return labels[achievement.tier];
  };

  const tierLabel = getTierLabel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative max-w-sm w-full mx-4 p-6 rounded-2xl
          ${getBackgroundStyle()} ${getBorderStyle()}
          shadow-2xl shadow-black/50
          animate-achievement-entrance
          text-center
        `}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Achievement unlocked label */}
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">
          Achievement Unlocked
        </p>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="animate-celebration-bounce">
            <AchievementIcon
              icon={achievement.icon}
              colorScheme={achievement.colorScheme}
              style={achievement.style}
              size="lg"
            />
          </div>
        </div>

        {/* Tier badge */}
        {tierLabel && (
          <p className={`text-xs font-medium uppercase tracking-wide ${tierLabel.color} mb-2`}>
            {tierLabel.text}
          </p>
        )}

        {/* Name */}
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          {achievement.name}
        </h2>

        {/* Description */}
        <p className="text-slate-400 mb-4">
          {achievement.description}
        </p>

        {/* Points */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30">
          <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-bold text-indigo-400">
            +{achievement.points} points
          </span>
        </div>

        {/* Category badge */}
        <div className="mt-4">
          <span className="text-xs text-slate-500 capitalize">
            {achievement.category.replace('_', ' ')} Achievement
          </span>
        </div>

        {/* Continue button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
