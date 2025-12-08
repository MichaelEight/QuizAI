/**
 * API Client with automatic token refresh
 */

import { config } from '../../config/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
  meta?: Record<string, unknown>;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  /**
   * Set access token (called after login)
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Make HTTP request with automatic retry on 401
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error?: { code: string; message: string; details?: string[] } }> {
    const url = `${config.apiUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add access token if available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // For httpOnly cookies (refresh token)
      });

      // Handle 401 - attempt token refresh
      if (response.status === 401 && this.accessToken) {
        const refreshed = await this.handleTokenRefresh();
        if (refreshed) {
          // Retry the original request with new token
          return this.request(endpoint, options);
        }
        // Refresh failed - redirect to login
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return { data: null, error: { code: 'UNAUTHORIZED', message: 'Session expired' } };
      }

      const json: ApiResponse<T> = await response.json();

      if (!response.ok) {
        return { data: null, error: json.error };
      }

      return { data: json.data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null,
        error: { code: 'NETWORK_ERROR', message: 'Network request failed' }
      };
    }
  }

  /**
   * Handle token refresh logic
   */
  private async handleTokenRefresh(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${config.apiUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) return false;

        const json: ApiResponse<{ accessToken: string; expiresIn: number }> = await response.json();
        if (json.data?.accessToken) {
          this.accessToken = json.data.accessToken;
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Convenience methods
   */
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
