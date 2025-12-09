import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BaseModal } from './BaseModal';
import { useApiKey } from '../context/ApiKeyContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';

interface AIAccessModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const API_KEY_PREFIX = 'sk-';

export function AIAccessModal({ isOpen, onClose }: AIAccessModalProps) {
  const navigate = useNavigate();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(false);

  const { setApiKey, hasApiKey, removeApiKey } = useApiKey();
  const { isAuthenticated, login } = useAuth();

  const handleClose = () => {
    if (onClose) onClose();
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setApiKeyInput('');
      setInviteCodeInput('');
      setError('');
      setIsProcessing(false);
      setShowApiKeyInput(false);
      setShowInviteInput(false);
    }
  }, [isOpen]);

  const handleOwnKeySubmit = () => {
    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      setError('API key is required');
      return;
    }

    if (!trimmedKey.startsWith(API_KEY_PREFIX)) {
      setError('Invalid API key format. Key should start with "sk-"');
      return;
    }

    setApiKey(trimmedKey);
    setApiKeyInput('');
    setError('');
    if (onClose) onClose();
  };

  const handleInviteCodeSubmit = async () => {
    const trimmedCode = inviteCodeInput.trim();

    if (!trimmedCode) {
      setError('Invite code is required');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Validate invite code
      const { data, error: validationError } = await apiClient.post<{
        valid: boolean;
        reason?: string;
        remainingUses?: number;
      }>(ENDPOINTS.AUTH_VALIDATE_INVITE, { code: trimmedCode });

      if (validationError || !data?.valid) {
        setError(data?.reason || validationError?.message || 'Invalid invite code');
        setIsProcessing(false);
        return;
      }

      // Store invite code in sessionStorage for OAuth flow
      sessionStorage.setItem('invite_code', trimmedCode);

      // Redirect to Google OAuth with invite code
      login();
    } catch (err) {
      setError('Failed to validate invite code');
      setIsProcessing(false);
    }
  };

  const handleNeither = () => {
    if (onClose) onClose();
    navigate('/');
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">AI Quiz Generation</h2>
          <p className="text-sm text-slate-400">Choose how you want to generate quizzes</p>
        </div>
      </div>

      {/* Options Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">Choose Option</h3>
        <div className="space-y-2">
          {/* Option 1: Own API Key */}
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="flex items-center gap-3 p-3 w-full bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors duration-200 text-left"
          >
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-slate-200 font-medium">Use your own API key</p>
              <p className="text-xs text-slate-400">No limits • Stored locally</p>
            </div>
            <div className={`transition-transform ${showApiKeyInput ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* API Key Input (Expandable) */}
          {showApiKeyInput && (
            <div className="p-4 bg-slate-700/20 rounded-lg border border-slate-600/50 space-y-3 animate-fade-in">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOwnKeySubmit()}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500">
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  platform.openai.com
                </a>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleOwnKeySubmit}
                  disabled={!apiKeyInput.trim() || isProcessing}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2 transition-all"
                >
                  {hasApiKey ? 'Update Key' : 'Save Key'}
                </button>
                {hasApiKey && (
                  <button
                    onClick={() => {
                      removeApiKey();
                      setApiKeyInput('');
                      setError('');
                    }}
                    className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 rounded-lg transition-all"
                    title="Clear API Key"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Option 2: Invite Code */}
          <button
            onClick={() => setShowInviteInput(!showInviteInput)}
            className="flex items-center gap-3 p-3 w-full bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors duration-200 text-left"
          >
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-slate-200 font-medium">Use invite code</p>
              <p className="text-xs text-slate-400">Free server processing • Sign-in required</p>
            </div>
            <div className={`transition-transform ${showInviteInput ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Invite Code Input (Expandable) */}
          {showInviteInput && (
            <div className="p-4 bg-slate-700/20 rounded-lg border border-slate-600/50 space-y-3 animate-fade-in">
              {isAuthenticated ? (
                <div className="text-sm text-slate-400">
                  <p>You already have an account and don't need an invite code.</p>
                  <p className="mt-2">Use server processing by switching to "Server" mode in the API settings.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-300 mb-2">
                      Invite Code
                    </label>
                    <input
                      id="inviteCode"
                      type="text"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInviteCodeSubmit()}
                      placeholder="Enter your invite code"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleInviteCodeSubmit}
                    disabled={!inviteCodeInput.trim() || isProcessing}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2 transition-all"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Validating...
                      </span>
                    ) : (
                      'Submit Invite Code'
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Option 3: Neither */}
          <button
            onClick={handleNeither}
            className="flex items-center gap-3 p-3 w-full bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors duration-200 text-left"
          >
            <div className="w-8 h-8 bg-slate-600/30 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-slate-200 font-medium">Neither - Import quizzes only</p>
              <p className="text-xs text-slate-400">Import and solve without AI generation</p>
            </div>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg text-sm bg-rose-500/10 border border-rose-500/20 text-rose-400">
          {error}
        </div>
      )}
    </BaseModal>
  );
}
