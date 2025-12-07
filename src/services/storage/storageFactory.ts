import { IStorageProvider } from '../../types/quizLibrary';
import { getIndexedDBProvider } from './IndexedDBProvider';

/**
 * Storage provider type - can be extended for online storage in the future
 */
export type StorageProviderType = 'indexeddb' | 'online';

/**
 * Get the current storage provider
 *
 * Future expansion:
 * - Add 'online' provider type when server sync is implemented
 * - Check authentication state to determine which provider to use
 * - Could implement hybrid mode (local + sync)
 */
export function getStorageProvider(type: StorageProviderType = 'indexeddb'): IStorageProvider {
  switch (type) {
    case 'indexeddb':
      return getIndexedDBProvider();

    // Future: case 'online':
    //   return getOnlineStorageProvider();

    default:
      return getIndexedDBProvider();
  }
}

/**
 * Get the default storage provider for the application
 * This is what most of the app should use
 */
export function getDefaultStorageProvider(): IStorageProvider {
  // Future: Check if user is authenticated and online mode is enabled
  // const isOnline = checkOnlineMode();
  // return getStorageProvider(isOnline ? 'online' : 'indexeddb');

  return getStorageProvider('indexeddb');
}
