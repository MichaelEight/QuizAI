/**
 * API endpoint constants
 */

export const ENDPOINTS = {
  // Auth
  AUTH_GOOGLE: '/auth/google',
  AUTH_CALLBACK: '/auth/google/callback',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  AUTH_VALIDATE_INVITE: '/auth/invite/validate',

  // Quizzes
  QUIZZES: '/quizzes',
  QUIZ_BY_ID: (id: string) => `/quizzes/${id}`,
  QUIZ_DUPLICATE: (id: string) => `/quizzes/${id}/duplicate`,
  QUIZ_PUBLISH: (id: string) => `/quizzes/${id}/publish`,
  QUIZ_UNPUBLISH: (id: string) => `/quizzes/${id}/unpublish`,
  QUIZ_DOWNLOAD: (id: string) => `/quizzes/${id}/download`,
  QUIZZES_PUBLIC: '/quizzes/public',

  // AI
  AI_GENERATE_QUESTIONS: '/ai/generate-questions',
  AI_CHECK_ANSWER: '/ai/check-answer',
  AI_GENERATE_HINT: '/ai/generate-hint',
  AI_GENERATE_EXPLANATION: '/ai/generate-explanation',

  // Favorites
  FAVORITES: '/favorites',
  FAVORITE_BY_ID: (id: string) => `/favorites/${id}`,

  // Ratings
  RATE_QUIZ: (quizId: string) => `/ratings/${quizId}`,
  GET_RATING: (quizId: string) => `/ratings/${quizId}`,
  DELETE_RATING: (quizId: string) => `/ratings/${quizId}`,
} as const;
