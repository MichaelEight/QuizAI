import { useEffect, useState } from 'react';
import { Achievement } from '../types/gamification';
import { AchievementIcon } from './AchievementIcon';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
  onClick?: () => void;
}

export function AchievementToast({ achievement, onDismiss, onClick }: AchievementToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!achievement) return;

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  const handleClick = () => {
    onClick?.();
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const getStyleClasses = () => {
    switch (achievement.style) {
      case 'legendary':
        return 'border-purple-300 bg-gradient-to-r from-purple-50 to-violet-100';
      case 'epic':
        return 'border-indigo-300 bg-indigo-100';
      case 'rare':
        return 'border-cyan-300 bg-white';
      default:
        return 'border-slate-300 bg-white';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <button
        onClick={handleClick}
        className={`
          flex items-center gap-3 p-4 rounded-xl border shadow-xl
          ${getStyleClasses()}
          ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}
          cursor-pointer hover:scale-[1.02] transition-transform
          max-w-xs
        `}
      >
        {/* Icon */}
        <div className="shrink-0">
          <AchievementIcon
            icon={achievement.icon}
            colorScheme={achievement.colorScheme}
            style={achievement.style}
            size="md"
          />
        </div>

        {/* Content */}
        <div className="text-left">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Achievement Unlocked!
          </p>
          <p className="font-semibold text-slate-900">
            {achievement.name}
          </p>
          <p className="text-sm text-indigo-600">
            +{achievement.points} points
          </p>
        </div>
      </button>
    </div>
  );
}
