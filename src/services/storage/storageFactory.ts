import { IStorageProvider } from '../../types/quizLibrary';
import { getIndexedDBProvider } from './IndexedDBProvider';
import { OnlineStorageProvider } from './OnlineStorageProvider';

/**
 * Storage provider type
 */
export type StorageProviderType = 'indexeddb' | 'online';

// Singleton instance for online provider
let onlineProviderInstance: OnlineStorageProvider | null = null;

function getOnlineStorageProvider(): OnlineStorageProvider {
  if (!onlineProviderInstance) {
    onlineProviderInstance = new OnlineStorageProvider();
  }
  return onlineProviderInstance;
}

/**
 * Get the current storage provider
 */
export function getStorageProvider(type: StorageProviderType = 'indexeddb'): IStorageProvider {
  switch (type) {
    case 'indexeddb':
      return getIndexedDBProvider();

    case 'online':
      return getOnlineStorageProvider();

    default:
      return getIndexedDBProvider();
  }
}

/**
 * Get storage provider based on authentication state
 */
export function getStorageProviderForAuth(isAuthenticated: boolean): IStorageProvider {
  if (isAuthenticated) {
    return getStorageProvider('online');
  }
  return getStorageProvider('indexeddb');
}
