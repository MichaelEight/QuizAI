import { useApiKey } from '../context/ApiKeyContext';

export function ApiKeyButton() {
  const { hasApiKey, setShowApiKeyModal } = useApiKey();

  return (
    <button
      onClick={() => setShowApiKeyModal(true)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-100 border border-slate-300 hover:border-slate-400 transition-all duration-200 text-sm"
      title={hasApiKey ? 'Change API Key' : 'Set API Key'}
    >
      <span
        className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-rose-500'}`}
      />
      <span className="text-slate-600">API Key</span>
    </button>
  );
}
