import { useApiKey } from '../context/ApiKeyContext';

export function ApiKeyButton() {
  const { hasApiKey, setShowApiKeyModal } = useApiKey();

  return (
    <button
      onClick={() => setShowApiKeyModal(true)}
      className="flex items-center gap-1 px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors text-sm"
      title={hasApiKey ? 'Change API Key' : 'Set API Key'}
    >
      <span
        className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span>API Key</span>
    </button>
  );
}
