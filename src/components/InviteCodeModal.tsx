/**
 * Invite Code Modal Component
 * Allows new users to enter an invite code during signup
 */

import { useState } from 'react';
import { BaseModal } from './BaseModal';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';
import { config } from '../config/environment';

interface InviteCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
}

export function InviteCodeModal({ isOpen, onClose, email }: InviteCodeModalProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const { data, error: apiError } = await apiClient.post<{
        valid: boolean;
        reason?: string;
        remainingUses?: number;
      }>(ENDPOINTS.AUTH_VALIDATE_INVITE, { code: code.trim() });

      if (apiError) {
        setError(apiError.message);
        setIsValid(false);
        return;
      }

      if (data?.valid) {
        setIsValid(true);
        // Redirect to Google OAuth with invite code
        const authUrl = `${config.apiUrl}${ENDPOINTS.AUTH_GOOGLE}?invite_code=${encodeURIComponent(code.trim())}`;
        window.location.href = authUrl;
      } else {
        setIsValid(false);
        const reasonMessages: Record<string, string> = {
          not_found: 'Invalid invite code',
          expired: 'This invite code has expired',
          max_uses_reached: 'This invite code has been fully used',
          already_claimed: 'You have already used an invite code',
        };
        setError(reasonMessages[data?.reason || 'not_found'] || 'Invalid invite code');
      }
    } catch (err) {
      setError('Failed to validate invite code. Please try again.');
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    setIsValid(null);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Invite Code Required</h2>
          <p className="mt-2 text-sm text-slate-400">
            QuizAI is currently in early access. Please enter your invite code to continue.
          </p>
          {email && (
            <p className="mt-2 text-sm text-slate-300">
              Signing in as: <span className="font-medium">{email}</span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-code" className="block text-sm font-medium text-slate-300 mb-2">
              Invite Code
            </label>
            <input
              id="invite-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
                setIsValid(null);
              }}
              placeholder="XXXXXXXX"
              maxLength={16}
              className={`w-full px-4 py-3 bg-slate-900 border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                isValid === true
                  ? 'border-emerald-500 focus:ring-emerald-500'
                  : isValid === false
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
              disabled={isValidating}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-rose-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 hover:text-slate-100 transition-colors"
              disabled={isValidating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isValidating || !code.trim()}
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Validating...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Don't have an invite code?{' '}
            <a
              href="mailto:support@quizai.app"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Request access
            </a>
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
