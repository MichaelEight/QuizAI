import { useApiKey } from '../context/ApiKeyContext';

export function ApiKeyButton() {
  const { hasApiKey, setShowApiKeyModal } = useApiKey();

  return (
    <button
      onClick={() => setShowApiKeyModal(true)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm"
      title={hasApiKey ? 'Change API Key' : 'Set API Key'}
    >
      <span
        className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-rose-400'}`}
      />
      <span className="text-slate-300">API Key</span>
    </button>
  );
}
