import { SavedQuiz, UpdateQuizData, IStorageProvider } from '../../types/quizLibrary';

const DB_NAME = 'quizai_library';
const DB_VERSION = 1;
const STORE_NAME = 'quizzes';

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

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

          // Create indexes for searching and sorting
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('subjectName', 'subjectName', { unique: false });
          store.createIndex('subjectCode', 'subjectCode', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
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
}

// Singleton instance
let providerInstance: IndexedDBProvider | null = null;

export function getIndexedDBProvider(): IndexedDBProvider {
  if (!providerInstance) {
    providerInstance = new IndexedDBProvider();
  }
  return providerInstance;
}
