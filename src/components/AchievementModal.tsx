import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Achievement } from '../types/gamification';
import { AchievementIcon } from './AchievementIcon';

interface AchievementModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!achievement) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [achievement, onClose]);

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
        return 'bg-gradient-to-br from-purple-100 via-white to-violet-500/40';
      case 'epic':
        return 'bg-gradient-to-br from-indigo-50 via-white to-purple-100';
      case 'rare':
        return 'bg-white';
      default:
        return 'bg-white';
    }
  };

  const getBorderStyle = () => {
    switch (achievement.style) {
      case 'legendary':
        return 'border-2 border-purple-300';
      case 'epic':
        return 'border-2 border-indigo-300';
      case 'rare':
        return 'border border-cyan-200';
      default:
        return 'border border-slate-200';
    }
  };

  const getTierLabel = () => {
    if (!achievement.tier) return null;
    const labels = {
      bronze: { text: 'Bronze', color: 'text-amber-600' },
      silver: { text: 'Silver', color: 'text-slate-600' },
      gold: { text: 'Gold', color: 'text-amber-600' },
      platinum: { text: 'Platinum', color: 'text-purple-600' },
    };
    return labels[achievement.tier];
  };

  const tierLabel = getTierLabel();

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative max-w-sm w-full mx-4 p-6 rounded-2xl
          ${getBackgroundStyle()} ${getBorderStyle()}
          shadow-2xl shadow-slate-900/10
          animate-achievement-entrance
          text-center
        `}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Achievement unlocked label */}
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">
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
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {achievement.name}
        </h2>

        {/* Description */}
        <p className="text-slate-500 mb-4">
          {achievement.description}
        </p>

        {/* Points */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200">
          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-bold text-indigo-600">
            +{achievement.points} points
          </span>
        </div>

        {/* Category badge */}
        <div className="mt-4">
          <span className="text-xs text-slate-400 capitalize">
            {achievement.category.replace('_', ' ')} Achievement
          </span>
        </div>

        {/* Continue button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );

  // Use portal to render at document.body level
  return createPortal(modalContent, document.body);
}
