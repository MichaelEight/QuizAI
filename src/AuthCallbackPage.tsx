/**
 * OAuth Callback Page
 * Handles the redirect after Google authentication
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from './context/AuthContext';
import { apiClient } from './services/api/apiClient';
import { InviteCodeModal } from './components/InviteCodeModal';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    // Check for errors from backend
    const errorParam = searchParams.get('error');
    if (errorParam) {
      handleError(errorParam);
      return;
    }

    // Get access token from URL
    const accessToken = searchParams.get('access_token');
    const expiresIn = searchParams.get('expires_in');
    const isNewUser = searchParams.get('is_new_user') === 'true';

    if (!accessToken) {
      setError('Authentication failed: No access token received');
      return;
    }

    try {
      // Store access token
      apiClient.setAccessToken(accessToken);

      // Clear any stored invite code
      sessionStorage.removeItem('pending_invite_code');

      // Refresh auth state to get user info
      await refreshAuth();

      // Redirect to home page
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Auth callback error:', err);
      setError('Failed to complete authentication');
    }
  }

  function handleError(errorType: string) {
    switch (errorType) {
      case 'invite_required':
        // Check if we have a stored invite code from a previous attempt
        const storedInviteCode = sessionStorage.getItem('pending_invite_code');

        if (storedInviteCode) {
          // We just came back from entering the invite code, but backend didn't receive it
          // This shouldn't happen with the state parameter, but clear it to prevent loops
          sessionStorage.removeItem('pending_invite_code');
        }

        // Show invite code modal
        const emailParam = searchParams.get('email');
        setEmail(emailParam);
        setShowInviteModal(true);
        break;

      case 'invalid_invite':
        const reason = searchParams.get('reason');
        const reasonMessages: Record<string, string> = {
          not_found: 'Invalid invite code',
          expired: 'Invite code has expired',
          max_uses_reached: 'Invite code has been fully used',
          already_claimed: 'You have already used an invite code',
        };
        setError(reasonMessages[reason || 'not_found'] || 'Invalid invite code');
        break;

      case 'auth_failed':
        const message = searchParams.get('message');
        setError(message || 'Authentication failed');
        break;

      default:
        setError('An unexpected error occurred');
    }
  }

  function handleInviteModalClose() {
    setShowInviteModal(false);
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        {error ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Authentication Error</h2>
              <p className="text-slate-400">{error}</p>
            </div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="animate-spin h-8 w-8 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
              >
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
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Completing sign in...</h2>
              <p className="text-slate-400">Please wait while we set up your account</p>
            </div>
          </div>
        )}
      </div>

      {/* Invite Code Modal */}
      <InviteCodeModal
        isOpen={showInviteModal}
        onClose={handleInviteModalClose}
        email={email || undefined}
      />
    </div>
  );
}
