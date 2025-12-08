import { useState } from 'react';
import { useApiKey } from '../context/ApiKeyContext';
import { useAuth } from '../context/AuthContext';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose?: () => void;
  allowClose?: boolean;
}

const API_KEY_PREFIX = 'sk-';

export function ApiKeyModal({
  isOpen,
  onClose,
  allowClose = false,
}: ApiKeyModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const { setApiKey, apiMode, setApiMode } = useApiKey();
  const { isAuthenticated, user } = useAuth();

  // Check if user can use server processing
  const canUseServerProcessing = isAuthenticated && user && ['free', 'premium', 'admin'].includes(user.tier);

  const handleSubmit = () => {
    const trimmedKey = inputValue.trim();

    if (!trimmedKey) {
      setError('API key is required');
      return;
    }

    if (!trimmedKey.startsWith(API_KEY_PREFIX)) {
      setError('Invalid API key format. Key should start with "sk-"');
      return;
    }

    setApiKey(trimmedKey);
    setInputValue('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
    if (e.key === 'Escape' && allowClose && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={allowClose ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-black/50 animate-fade-in">
        {/* Close button */}
        {allowClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">OpenAI API Key</h2>
            <p className="text-sm text-slate-400">Required to generate questions</p>
          </div>
        </div>

        {/* Mode Switcher (only for authenticated users) */}
        {canUseServerProcessing && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Processing Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg">
              <button
                onClick={() => setApiMode('server')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  apiMode === 'server'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  Server
                </div>
              </button>
              <button
                onClick={() => setApiMode('own-key')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  apiMode === 'own-key'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Own Key
                </div>
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {apiMode === 'server'
                ? 'Using server API processing (free tier included)'
                : 'Use your own OpenAI API key'
              }
            </p>
          </div>
        )}

        {/* Info */}
        {apiMode === 'own-key' && (
          <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-400">
              Your API key is stored locally in your browser and only sent to OpenAI.
            </p>
          </div>
        )}

        {/* Input (only show for own-key mode) */}
        {apiMode === 'own-key' && (
          <div className="mb-4">
          <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
            API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="sk-..."
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-rose-400">{error}</p>
          )}
          </div>
        )}

        {/* Help link (only for own-key mode) */}
        {apiMode === 'own-key' && (
          <p className="mb-6 text-xs text-slate-500">
            Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              platform.openai.com/api-keys
            </a>
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {apiMode === 'own-key' && (
            <button
              onClick={handleSubmit}
              className="flex-1 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-medium rounded-lg px-4 py-3 transition-all duration-200 active:scale-[0.98]"
            >
              Save Key
            </button>
          )}
          {apiMode === 'server' && allowClose && (
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-3 transition-all duration-200"
            >
              Use Server Processing
            </button>
          )}
          {allowClose && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
