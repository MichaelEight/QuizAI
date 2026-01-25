import { UsageLog } from "../../types/usage";

const DB_NAME = "quizai_library";
const DB_VERSION = 3;
const USAGE_STORE_NAME = "usage_logs";

/**
 * Storage provider for OpenAI usage logs in IndexedDB
 */
export class UsageStorageProvider {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB for usage logs:", request.error);
        reject(new Error("Failed to open database"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      // Note: The schema migration is handled by IndexedDBProvider
      // This just needs to connect to the existing database
    });
  }

  private getStore(mode: IDBTransactionMode = "readonly"): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    const transaction = this.db.transaction(USAGE_STORE_NAME, mode);
    return transaction.objectStore(USAGE_STORE_NAME);
  }

  /**
   * Save a single usage log
   */
  async saveLog(log: UsageLog): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("readwrite");
      const request = store.add(log);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Failed to save usage log:", request.error);
        reject(new Error("Failed to save usage log"));
      };
    });
  }

  /**
   * Get all usage logs
   */
  async getAllLogs(): Promise<UsageLog[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("readonly");
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as UsageLog[]);
      };

      request.onerror = () => {
        console.error("Failed to get all usage logs:", request.error);
        reject(new Error("Failed to retrieve usage logs"));
      };
    });
  }

  /**
   * Get logs by quiz ID
   */
  async getLogsByQuizId(quizId: string): Promise<UsageLog[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("readonly");
      const index = store.index("quizId");
      const request = index.getAll(quizId);

      request.onsuccess = () => {
        resolve(request.result as UsageLog[]);
      };

      request.onerror = () => {
        console.error("Failed to get logs by quizId:", request.error);
        reject(new Error("Failed to retrieve usage logs"));
      };
    });
  }

  /**
   * Get logs by date range
   */
  async getLogsByDateRange(
    startDate: number,
    endDate: number
  ): Promise<UsageLog[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("readonly");
      const index = store.index("timestamp");
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => {
        resolve(request.result as UsageLog[]);
      };

      request.onerror = () => {
        console.error("Failed to get logs by date range:", request.error);
        reject(new Error("Failed to retrieve usage logs"));
      };
    });
  }

  /**
   * Delete specific logs by IDs
   */
  async deleteLogs(logIds: string[]): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("readwrite");
      let completed = 0;
      let hasError = false;

      if (logIds.length === 0) {
        resolve();
        return;
      }

      for (const id of logIds) {
        const request = store.delete(id);

        request.onsuccess = () => {
          completed++;
          if (completed === logIds.length && !hasError) {
            resolve();
          }
        };

        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            console.error("Failed to delete usage log:", request.error);
            reject(new Error("Failed to delete usage logs"));
          }
        };
      }
    });
  }

  /**
   * Delete all usage logs
   */
  async deleteAllLogs(): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const store = this.getStore("readwrite");
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Failed to delete all usage logs:", request.error);
        reject(new Error("Failed to delete all usage logs"));
      };
    });
  }
}

// Singleton instance
let usageProviderInstance: UsageStorageProvider | null = null;

export function getUsageStorageProvider(): UsageStorageProvider {
  if (!usageProviderInstance) {
    usageProviderInstance = new UsageStorageProvider();
  }
  return usageProviderInstance;
}
