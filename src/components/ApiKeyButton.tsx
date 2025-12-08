import { useApiKey } from '../context/ApiKeyContext';
import { useAuth } from '../context/AuthContext';

export function ApiKeyButton() {
  const { hasApiKey, apiMode, setShowApiKeyModal } = useApiKey();
  const { isAuthenticated, user } = useAuth();

  // Determine indicator color and label
  const getIndicatorState = () => {
    if (apiMode === 'server') {
      // Using server processing
      return {
        color: 'bg-blue-400',
        label: 'Server',
        tooltip: 'Using server API processing',
      };
    } else if (hasApiKey) {
      // Using own key
      return {
        color: 'bg-emerald-400',
        label: 'Own Key',
        tooltip: 'Using your own API key',
      };
    } else {
      // No key set
      return {
        color: 'bg-rose-400',
        label: 'No Key',
        tooltip: 'No API key configured',
      };
    }
  };

  const state = getIndicatorState();

  return (
    <button
      onClick={() => setShowApiKeyModal(true)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm"
      title={state.tooltip}
    >
      <span className={`w-2 h-2 rounded-full ${state.color}`} />
      <span className="text-slate-300">{state.label}</span>
    </button>
  );
}
