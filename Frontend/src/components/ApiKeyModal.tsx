import { useState } from 'react';
import { useApiKey } from '../context/ApiKeyContext';

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
  const { setApiKey } = useApiKey();

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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Enter OpenAI API Key</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Your API key is stored locally in your browser and never sent to any
          server other than OpenAI.
        </p>
        <p className="text-gray-500 mb-4 text-xs">
          Get your API key from{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            platform.openai.com/api-keys
          </a>
        </p>
        <input
          type="password"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="sk-..."
          className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition-colors"
          >
            Save Key
          </button>
          {allowClose && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
