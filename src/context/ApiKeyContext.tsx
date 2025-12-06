import { createContext, useContext, useState, ReactNode } from 'react';
import { OpenAIClientManager } from '../services/openaiClient';

interface ApiKeyContextType {
  hasApiKey: boolean;
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  showApiKeyModal: boolean;
  setShowApiKeyModal: (show: boolean) => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

interface ApiKeyProviderProps {
  children: ReactNode;
}

export function ApiKeyProvider({ children }: ApiKeyProviderProps) {
  const [hasApiKey, setHasApiKey] = useState(OpenAIClientManager.hasApiKey());
  const [showApiKeyModal, setShowApiKeyModal] = useState(
    !OpenAIClientManager.hasApiKey(),
  );

  const handleSetApiKey = (key: string) => {
    OpenAIClientManager.setApiKey(key);
    setHasApiKey(true);
    setShowApiKeyModal(false);
  };

  const handleRemoveApiKey = () => {
    OpenAIClientManager.removeApiKey();
    setHasApiKey(false);
    setShowApiKeyModal(true);
  };

  return (
    <ApiKeyContext.Provider
      value={{
        hasApiKey,
        setApiKey: handleSetApiKey,
        removeApiKey: handleRemoveApiKey,
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
