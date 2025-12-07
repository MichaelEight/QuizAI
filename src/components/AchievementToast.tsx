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
        return 'border-purple-500/50 bg-gradient-to-r from-purple-500/20 to-indigo-500/20';
      case 'epic':
        return 'border-indigo-500/50 bg-indigo-500/20';
      case 'rare':
        return 'border-cyan-500/40 bg-cyan-500/15';
      default:
        return 'border-slate-600 bg-slate-800';
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
          <p className="text-xs text-slate-400 uppercase tracking-wide">
            Achievement Unlocked!
          </p>
          <p className="font-semibold text-slate-100">
            {achievement.name}
          </p>
          <p className="text-sm text-indigo-400">
            +{achievement.points} points
          </p>
        </div>
      </button>
    </div>
  );
}
