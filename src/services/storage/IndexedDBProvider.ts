import { SavedQuiz, UpdateQuizData, IStorageProvider } from '../../types/quizLibrary';

const DB_NAME = 'quizai_library';
const DB_VERSION = 3;
const STORE_NAME = 'quizzes';
const USAGE_STORE_NAME = 'usage_logs';

/**
 * IndexedDB implementation of storage provider for local quiz library
 */
export class IndexedDBProvider implements IStorageProvider {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const oldVersion = event.oldVersion;

        // Create object store if it doesn't exist (v1)
        let store: IDBObjectStore;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

          // Create indexes for searching and sorting
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('subjectName', 'subjectName', { unique: false });
          store.createIndex('subjectCode', 'subjectCode', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        } else {
          store = transaction.objectStore(STORE_NAME);
        }

        // Migration from v1 to v2: Add groupId index and migrate data
        if (oldVersion < 2) {
          // Add groupId index
          if (!store.indexNames.contains('groupId')) {
            store.createIndex('groupId', 'groupId', { unique: false });
          }

          // Migrate existing quizzes to assign groupIds
          this.migrateGroupIds(store);
        }

        // Migration from v2 to v3: Add usage_logs object store
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains(USAGE_STORE_NAME)) {
            const usageStore = db.createObjectStore(USAGE_STORE_NAME, { keyPath: 'id' });

            // Create indexes for querying usage logs
            usageStore.createIndex('timestamp', 'timestamp', { unique: false });
            usageStore.createIndex('quizId', 'quizId', { unique: false });
            usageStore.createIndex('operationType', 'operationType', { unique: false });
            usageStore.createIndex('quizId_timestamp', ['quizId', 'timestamp'], { unique: false });
          }
        }
      };
    });
  }

  private getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    const transaction = this.db.transaction(STORE_NAME, mode);
    return transaction.objectStore(STORE_NAME);
  }

  /**
   * Migrate existing quizzes to assign groupIds
   * Groups quizzes by their root (originalQuizId chains and backup chains)
   */
  private migrateGroupIds(store: IDBObjectStore): void {
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      const quizzes = getAllRequest.result as SavedQuiz[];
      if (quizzes.length === 0) return;

      const quizzesById = new Map<string, SavedQuiz>();
      const quizzesNeedingGroupId: SavedQuiz[] = [];

      // Index all quizzes and find those needing groupId
      for (const quiz of quizzes) {
        quizzesById.set(quiz.id, quiz);
        if (!quiz.groupId) {
          quizzesNeedingGroupId.push(quiz);
        }
      }

      if (quizzesNeedingGroupId.length === 0) return;

      // Helper to find root quiz ID (walks up originalQuizId chain)
      const findRootId = (quiz: SavedQuiz): string => {
        if (!quiz.originalQuizId) return quiz.id;
        const parent = quizzesById.get(quiz.originalQuizId);
        return parent ? findRootId(parent) : quiz.originalQuizId;
      };

      // Helper to find all related quiz IDs (translations and backup chains)
      const findRelatedIds = (rootId: string): Set<string> => {
        const related = new Set<string>();
        related.add(rootId);

        // Find all translations (quizzes with this rootId as original)
        for (const quiz of quizzes) {
          const quizRoot = findRootId(quiz);
          if (quizRoot === rootId) {
            related.add(quiz.id);

            // Also include backup chains
            if (quiz.previousVersionId) {
              const backup = quizzesById.get(quiz.previousVersionId);
              if (backup) {
                related.add(backup.id);
              }
            }
          }
        }

        return related;
      };

      // Assign groupIds
      const processedIds = new Set<string>();

      for (const quiz of quizzesNeedingGroupId) {
        if (processedIds.has(quiz.id)) continue;

        // Determine root ID for this quiz
        const rootId = findRootId(quiz);

        // Find all related quizzes
        const relatedIds = findRelatedIds(rootId);

        // Assign same groupId to all related quizzes
        for (const relatedId of relatedIds) {
          const relatedQuiz = quizzesById.get(relatedId);
          if (relatedQuiz && !relatedQuiz.groupId) {
            const updated: SavedQuiz = {
              ...relatedQuiz,
              groupId: rootId, // Use root ID as group ID
            };

            store.put(updated);
            processedIds.add(relatedId);
          }
        }
      }
    };

    getAllRequest.onerror = () => {
      console.error('Failed to migrate groupIds:', getAllRequest.error);
    };
  }

  async getAll(): Promise<SavedQuiz[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore('readonly');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as SavedQuiz[]);
      };

      request.onerror = () => {
        console.error('Failed to get all quizzes:', request.error);
        reject(new Error('Failed to retrieve quizzes'));
      };
    });
  }

  async getById(id: string): Promise<SavedQuiz | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore('readonly');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result as SavedQuiz | null);
      };

      request.onerror = () => {
        console.error('Failed to get quiz:', request.error);
        reject(new Error('Failed to retrieve quiz'));
      };
    });
  }

  async getByGroupId(groupId: string): Promise<SavedQuiz[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore('readonly');
      const index = store.index('groupId');
      const request = index.getAll(groupId);

      request.onsuccess = () => {
        resolve(request.result as SavedQuiz[]);
      };

      request.onerror = () => {
        console.error('Failed to get quizzes by groupId:', request.error);
        reject(new Error('Failed to retrieve quizzes'));
      };
    });
  }

  async save(quiz: SavedQuiz): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.add(quiz);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save quiz:', request.error);
        reject(new Error('Failed to save quiz'));
      };
    });
  }

  async update(id: string, data: UpdateQuizData): Promise<void> {
    await this.initialize();

    // First get the existing quiz
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Quiz with id ${id} not found`);
    }

    // Merge updates
    const updated: SavedQuiz = {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.put(updated);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to update quiz:', request.error);
        reject(new Error('Failed to update quiz'));
      };
    });
  }

  async delete(id: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete quiz:', request.error);
        reject(new Error('Failed to delete quiz'));
      };
    });
  }

  async importBulk(quizzes: SavedQuiz[]): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      let completed = 0;
      let hasError = false;

      if (quizzes.length === 0) {
        resolve();
        return;
      }

      for (const quiz of quizzes) {
        const request = store.put(quiz); // put will update or insert

        request.onsuccess = () => {
          completed++;
          if (completed === quizzes.length && !hasError) {
            resolve();
          }
        };

        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            console.error('Failed to import quiz:', request.error);
            reject(new Error('Failed to import quizzes'));
          }
        };
      }
    });
  }

  async exportAll(): Promise<SavedQuiz[]> {
    return this.getAll();
  }

  async saveNewVersion(quizId: string, newQuizData: SavedQuiz): Promise<void> {
    await this.initialize();

    // 1. Get current version
    const current = await this.getById(quizId);
    if (!current) {
      throw new Error(`Quiz with id ${quizId} not found`);
    }

    // 2. Delete old backup if exists
    if (current.previousVersionId) {
      await this.delete(current.previousVersionId);
    }

    // 3. Save current as backup
    const backupId = `${quizId}-v${current.version || 1}-backup`;
    const backup: SavedQuiz = {
      ...current,
      id: backupId,
      isBackup: true,
      groupId: current.groupId || quizId, // Preserve groupId
    };

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');

      // Save backup
      const backupRequest = store.put(backup);

      backupRequest.onsuccess = () => {
        // 4. Update current with new data + incremented version
        const updated: SavedQuiz = {
          ...newQuizData,
          id: quizId,
          version: (current.version || 1) + 1,
          previousVersionId: backupId,
          groupId: current.groupId || quizId, // Preserve groupId
          updatedAt: Date.now(),
          createdAt: current.createdAt, // Preserve original creation time
        };

        const updateRequest = store.put(updated);

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = () => {
          console.error('Failed to save new version:', updateRequest.error);
          reject(new Error('Failed to save new version'));
        };
      };

      backupRequest.onerror = () => {
        console.error('Failed to save backup:', backupRequest.error);
        reject(new Error('Failed to save backup'));
      };
    });
  }

  async getBackupVersion(quizId: string): Promise<SavedQuiz | null> {
    await this.initialize();

    // First get the current quiz to find the backup ID
    const current = await this.getById(quizId);
    if (!current || !current.previousVersionId) {
      return null;
    }

    return this.getById(current.previousVersionId);
  }

  async restoreBackupVersion(quizId: string): Promise<void> {
    await this.initialize();

    // Get current and backup
    const current = await this.getById(quizId);
    if (!current) {
      throw new Error(`Quiz with id ${quizId} not found`);
    }

    if (!current.previousVersionId) {
      throw new Error('No backup version available');
    }

    const backup = await this.getById(current.previousVersionId);
    if (!backup) {
      throw new Error('Backup version not found');
    }

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');

      // Swap: current becomes backup, backup becomes current
      const newBackupId = `${quizId}-v${current.version || 1}-backup`;
      const groupId = current.groupId || quizId; // Preserve groupId

      const newBackup: SavedQuiz = {
        ...current,
        id: newBackupId,
        isBackup: true,
        groupId, // Preserve groupId
      };

      const newCurrent: SavedQuiz = {
        ...backup,
        id: quizId,
        version: (current.version || 1) + 1, // Increment version on restore
        previousVersionId: newBackupId,
        groupId, // Preserve groupId
        isBackup: false,
        updatedAt: Date.now(),
      };

      // Helper to save backup and current
      const saveBackupAndCurrent = () => {
        const backupRequest = store.put(newBackup);

        backupRequest.onsuccess = () => {
          // Update current
          const currentRequest = store.put(newCurrent);

          currentRequest.onsuccess = () => {
            resolve();
          };

          currentRequest.onerror = () => {
            console.error('Failed to restore current:', currentRequest.error);
            reject(new Error('Failed to restore current version'));
          };
        };

        backupRequest.onerror = () => {
          console.error('Failed to save new backup:', backupRequest.error);
          reject(new Error('Failed to save new backup'));
        };
      };

      // Delete old backup if it exists
      if (current.previousVersionId) {
        const deleteRequest = store.delete(current.previousVersionId);

        deleteRequest.onsuccess = () => {
          saveBackupAndCurrent();
        };

        deleteRequest.onerror = () => {
          console.error('Failed to delete old backup:', deleteRequest.error);
          reject(new Error('Failed to delete old backup'));
        };
      } else {
        // No old backup to delete, proceed directly
        saveBackupAndCurrent();
      }
    });
  }

  async deleteBackup(quizId: string): Promise<void> {
    await this.initialize();

    const current = await this.getById(quizId);
    if (!current || !current.previousVersionId) {
      return; // No backup to delete
    }

    // Delete the backup
    await this.delete(current.previousVersionId);

    // Update current to remove previousVersionId reference
    const updated: SavedQuiz = {
      ...current,
      previousVersionId: undefined,
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.put(updated);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to update quiz after deleting backup:', request.error);
        reject(new Error('Failed to update quiz'));
      };
    });
  }
}

// Singleton instance
let providerInstance: IndexedDBProvider | null = null;

export function getIndexedDBProvider(): IndexedDBProvider {
  if (!providerInstance) {
    providerInstance = new IndexedDBProvider();
  }
  return providerInstance;
}
