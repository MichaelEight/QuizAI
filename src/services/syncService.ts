/**
 * Sync Service
 * Handles synchronization of local quizzes to cloud storage
 */

import { SavedQuiz } from '../types/quizLibrary';
import { getIndexedDBProvider } from './storage/IndexedDBProvider';
import { OnlineStorageProvider } from './storage/OnlineStorageProvider';

export interface SyncResult {
  success: boolean;
  totalQuizzes: number;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ quizTitle: string; error: string }>;
}

/**
 * Sync local quizzes to cloud storage
 */
export async function syncLocalQuizzesToCloud(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    totalQuizzes: 0,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // Get local quizzes
    const localProvider = getIndexedDBProvider();
    await localProvider.initialize();
    const localQuizzes = await localProvider.getAll();

    result.totalQuizzes = localQuizzes.length;

    if (localQuizzes.length === 0) {
      result.success = true;
      return result;
    }

    // Upload to cloud
    const onlineProvider = new OnlineStorageProvider();
    await onlineProvider.initialize();

    for (const quiz of localQuizzes) {
      try {
        await onlineProvider.save(quiz);
        result.syncedCount++;
      } catch (error) {
        result.failedCount++;
        result.errors.push({
          quizTitle: quiz.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    result.success = result.failedCount === 0;
    return result;
  } catch (error) {
    console.error('Sync failed:', error);
    result.errors.push({
      quizTitle: 'General',
      error: error instanceof Error ? error.message : 'Failed to sync quizzes',
    });
    return result;
  }
}

/**
 * Check if there are local quizzes that need syncing
 */
export async function hasLocalQuizzes(): Promise<boolean> {
  try {
    const localProvider = getIndexedDBProvider();
    await localProvider.initialize();
    const localQuizzes = await localProvider.getAll();
    return localQuizzes.length > 0;
  } catch (error) {
    console.error('Failed to check local quizzes:', error);
    return false;
  }
}

/**
 * Get count of local quizzes
 */
export async function getLocalQuizzesCount(): Promise<number> {
  try {
    const localProvider = getIndexedDBProvider();
    await localProvider.initialize();
    const localQuizzes = await localProvider.getAll();
    return localQuizzes.length;
  } catch (error) {
    console.error('Failed to get local quizzes count:', error);
    return 0;
  }
}
