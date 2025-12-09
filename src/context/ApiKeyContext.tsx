import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
const ACCESS_TOKEN_KEY = 'quizai_access_token';

export function ApiKeyProvider({ children }: ApiKeyProviderProps) {
  const [hasApiKey, setHasApiKey] = useState(OpenAIClientManager.hasApiKey());
  const [apiMode, setApiModeState] = useState<ApiMode>(() => {
    const stored = localStorage.getItem(API_MODE_KEY);
    const hasAccessToken = !!localStorage.getItem(ACCESS_TOKEN_KEY);

    // If stored mode is 'server' but no access token, force 'own-key'
    if (stored === 'server' && !hasAccessToken) {
      localStorage.setItem(API_MODE_KEY, 'own-key');
      return 'own-key';
    }

    return (stored === 'server' || stored === 'own-key') ? stored : 'own-key';
  });
  // Don't auto-show modal - let pages decide when to show it
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

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
  };

  // Listen for mode changes from logout
  useEffect(() => {
    const handleModeChange = (e: CustomEvent<ApiMode>) => {
      setApiModeState(e.detail);
    };
    window.addEventListener('apiMode:change', handleModeChange as EventListener);
    return () => window.removeEventListener('apiMode:change', handleModeChange as EventListener);
  }, []);

  // Validate mode whenever authentication status changes
  useEffect(() => {
    const handleAuthChange = () => {
      const hasAccessToken = !!localStorage.getItem(ACCESS_TOKEN_KEY);

      // If in server mode but no access token, force switch to own-key
      if (apiMode === 'server' && !hasAccessToken) {
        setApiModeState('own-key');
        localStorage.setItem(API_MODE_KEY, 'own-key');
      }
    };

    // Listen for logout events
    window.addEventListener('auth:logout', handleAuthChange);

    // Also check periodically (in case token was cleared by another means)
    const interval = setInterval(handleAuthChange, 5000);

    return () => {
      window.removeEventListener('auth:logout', handleAuthChange);
      clearInterval(interval);
    };
  }, [apiMode]);

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
