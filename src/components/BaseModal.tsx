import { useEffect } from 'react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function BaseModal({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-md"
}: BaseModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative bg-slate-800 border border-slate-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 ${maxWidth} w-full mx-2 sm:mx-4 shadow-2xl shadow-black/50 animate-fade-in max-h-[90vh] sm:max-h-[85vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}
