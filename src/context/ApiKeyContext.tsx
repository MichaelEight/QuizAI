import { createContext, useContext, useState, ReactNode } from 'react';
import { OpenAIClientManager } from '../services/openaiClient';

type ApiMode = 'own-key' | 'server';

interface ApiKeyContextType {
  hasApiKey: boolean;
  apiMode: ApiMode;
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  setApiMode: (mode: ApiMode) => void;
  showApiKeyModal: boolean;
  setShowApiKeyModal: (show: boolean) => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

interface ApiKeyProviderProps {
  children: ReactNode;
}

const API_MODE_KEY = 'quizai_api_mode';

export function ApiKeyProvider({ children }: ApiKeyProviderProps) {
  const [hasApiKey, setHasApiKey] = useState(OpenAIClientManager.hasApiKey());
  const [apiMode, setApiModeState] = useState<ApiMode>(() => {
    const stored = localStorage.getItem(API_MODE_KEY);
    return (stored === 'server' || stored === 'own-key') ? stored : 'own-key';
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(
    !OpenAIClientManager.hasApiKey() && apiMode === 'own-key',
  );

  const handleSetApiKey = (key: string) => {
    OpenAIClientManager.setApiKey(key);
    setHasApiKey(true);
    setApiModeState('own-key');
    localStorage.setItem(API_MODE_KEY, 'own-key');
    setShowApiKeyModal(false);
  };

  const handleRemoveApiKey = () => {
    OpenAIClientManager.removeApiKey();
    setHasApiKey(false);
    setShowApiKeyModal(true);
  };

  const handleSetApiMode = (mode: ApiMode) => {
    setApiModeState(mode);
    localStorage.setItem(API_MODE_KEY, mode);

    // If switching to own-key mode but no key is set, show modal
    if (mode === 'own-key' && !hasApiKey) {
      setShowApiKeyModal(true);
    }
  };

  return (
    <ApiKeyContext.Provider
      value={{
        hasApiKey,
        apiMode,
        setApiKey: handleSetApiKey,
        removeApiKey: handleRemoveApiKey,
        setApiMode: handleSetApiMode,
        showApiKeyModal,
        setShowApiKeyModal,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within ApiKeyProvider');
  }
  return context;
}
