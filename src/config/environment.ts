/**
 * Environment configuration
 * Type-safe access to environment variables
 */

interface AppConfig {
  apiUrl: string;
  googleClientId: string;
  onlineFeaturesEnabled: boolean;
}

export const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  onlineFeaturesEnabled: import.meta.env.VITE_ENABLE_ONLINE_FEATURES === 'true',
};

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.apiUrl) {
    errors.push('VITE_API_URL is not set');
  }

  if (errors.length > 0) {
    console.warn('Configuration warnings:', errors);
  }
}

// Validate config on import (only in development)
if (import.meta.env.DEV) {
  validateConfig();
}
