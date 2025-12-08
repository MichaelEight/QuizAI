/**
 * Authentication Context
 * Manages user authentication state and auth operations
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';
import { config } from '../config/environment';

interface User {
  id: string;
  email: string;
  name: string;
  pictureUrl?: string;
  tier: 'free' | 'premium' | 'admin';
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();

    // Listen for logout events (e.g., from expired token)
    const handleLogout = () => {
      setState({ isAuthenticated: false, isLoading: false, user: null });
      apiClient.setAccessToken(null);
      // Switch to own-key mode when logged out
      localStorage.setItem('quizai_api_mode', 'own-key');
      window.dispatchEvent(new CustomEvent('apiMode:change', { detail: 'own-key' }));
    };
    window.addEventListener('auth:logout', handleLogout);

    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  /**
   * Check if user is authenticated
   */
  async function checkAuthStatus() {
    try {
      const { data, error } = await apiClient.get<User>(ENDPOINTS.AUTH_ME);

      if (data) {
        setState({ isAuthenticated: true, isLoading: false, user: data });
      } else {
        setState({ isAuthenticated: false, isLoading: false, user: null });
      }
    } catch (err) {
      setState({ isAuthenticated: false, isLoading: false, user: null });
    }
  }

  /**
   * Initiate login flow (redirect to Google OAuth)
   */
  function login() {
    // Redirect to backend OAuth endpoint
    window.location.href = `${config.apiUrl}${ENDPOINTS.AUTH_GOOGLE}`;
  }

  /**
   * Logout user
   */
  async function logout() {
    try {
      await apiClient.post(ENDPOINTS.AUTH_LOGOUT, {});
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      apiClient.setAccessToken(null);
      setState({ isAuthenticated: false, isLoading: false, user: null });
      // Switch to own-key mode when logged out
      localStorage.setItem('quizai_api_mode', 'own-key');
      window.dispatchEvent(new CustomEvent('apiMode:change', { detail: 'own-key' }));
    }
  }

  /**
   * Refresh auth state (e.g., after login callback)
   */
  async function refreshAuth() {
    await checkAuthStatus();
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
