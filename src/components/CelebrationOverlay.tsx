import { useEffect, useState } from 'react';
import { CelebrationEvent } from '../types/gamification';

interface CelebrationOverlayProps {
  celebration: CelebrationEvent | null;
  onComplete?: () => void;
}

export function CelebrationOverlay({ celebration, onComplete }: CelebrationOverlayProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!celebration) return;

    // Trigger confetti for achievements and learnt questions
    if (celebration.type === 'achievement' || celebration.type === 'learnt') {
      createConfetti();
    }

    // Auto-dismiss after animation
    const timer = setTimeout(() => {
      onComplete?.();
    }, celebration.type === 'achievement' ? 3000 : 1500);

    return () => clearTimeout(timer);
  }, [celebration, onComplete]);

  const createConfetti = () => {
    const pieces: ConfettiPiece[] = [];
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];

    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      });
    }

    setConfetti(pieces);

    // Clear confetti after animation
    setTimeout(() => setConfetti([]), 3000);
  };

  if (!celebration) return null;

  return (
    <>
      {/* Confetti container */}
      {confetti.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confetti.map(piece => (
            <div
              key={piece.id}
              className="absolute animate-confetti"
              style={{
                left: `${piece.x}%`,
                animationDelay: `${piece.delay}s`,
                top: '-20px',
              }}
            >
              <div
                style={{
                  width: piece.size,
                  height: piece.size,
                  backgroundColor: piece.color,
                  transform: `rotate(${piece.rotation}deg)`,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Learnt question flash effect */}
      {celebration.type === 'learnt' && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-emerald-500/10 animate-fade-in" />
        </div>
      )}
    </>
  );
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
}

// Correct answer ripple effect component
interface CorrectAnswerEffectProps {
  show: boolean;
  onComplete?: () => void;
}

export function CorrectAnswerEffect({ show, onComplete }: CorrectAnswerEffectProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      <div className="absolute inset-0 animate-glow-success" />
    </div>
  );
}

// Learnt question star effect
interface LearntEffectProps {
  show: boolean;
}

export function LearntEffect({ show }: LearntEffectProps) {
  if (!show) return null;

  return (
    <div className="absolute -top-2 -right-2 z-10">
      <div className="animate-star-burst">
        <svg
          className="w-8 h-8 text-emerald-400 drop-shadow-lg"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
    </div>
  );
}
