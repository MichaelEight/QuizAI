import { createContext, useContext, useState, ReactNode } from 'react';
import { OpenAIClientManager } from '../services/openaiClient';

// Remembers that the user has made the first-run AI choice (added a key or
// chose to continue without AI), so the welcome screen doesn't nag every load.
const AI_CHOICE_STORAGE_KEY = 'quizai_ai_choice_made';

function readChoiceMade(): boolean {
  try {
    return localStorage.getItem(AI_CHOICE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface ApiKeyContextType {
  /** True when a usable OpenAI key is configured — gates all AI features. */
  hasApiKey: boolean;
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  showApiKeyModal: boolean;
  setShowApiKeyModal: (show: boolean) => void;
  /** First-run choice screen: add a key or continue without AI. */
  showWelcome: boolean;
  /** Record the first-run choice so the welcome screen stays dismissed. */
  dismissWelcome: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

interface ApiKeyProviderProps {
  children: ReactNode;
}

export function ApiKeyProvider({ children }: ApiKeyProviderProps) {
  const [hasApiKey, setHasApiKey] = useState(OpenAIClientManager.hasApiKey());
  // The key modal is no longer forced on launch — the key is optional. New
  // users without a key (and without a recorded choice) get the welcome screen.
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(
    () => !OpenAIClientManager.hasApiKey() && !readChoiceMade(),
  );

  const markChoiceMade = () => {
    try {
      localStorage.setItem(AI_CHOICE_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  };

  const handleSetApiKey = (key: string) => {
    OpenAIClientManager.setApiKey(key);
    setHasApiKey(true);
    setShowApiKeyModal(false);
    setShowWelcome(false);
    markChoiceMade();
  };

  const handleRemoveApiKey = () => {
    OpenAIClientManager.removeApiKey();
    setHasApiKey(false);
    // Don't re-open the welcome screen — the user already knows the app exists.
  };

  const dismissWelcome = () => {
    setShowWelcome(false);
    markChoiceMade();
  };

  return (
    <ApiKeyContext.Provider
      value={{
        hasApiKey,
        setApiKey: handleSetApiKey,
        removeApiKey: handleRemoveApiKey,
        showApiKeyModal,
        setShowApiKeyModal,
        showWelcome,
        dismissWelcome,
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
