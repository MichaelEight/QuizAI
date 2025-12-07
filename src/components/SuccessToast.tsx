import { useEffect, useState } from 'react';

interface SuccessToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function SuccessToast({ message, onDismiss }: SuccessToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!message) return;

    // Reset exit state when new message appears
    setIsExiting(false);

    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed top-20 right-4 z-[100]">
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl
          border-emerald-500/40 bg-emerald-500/15
          ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}
          max-w-xs
        `}
      >
        {/* Checkmark Icon */}
        <div className="shrink-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Message */}
        <p className="font-medium text-slate-100">
          {message}
        </p>
      </div>
    </div>
  );
}
