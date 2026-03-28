const DB_NAME = "xthex-offline";
const DB_VERSION = 1;
const STORE = "kv";

type Entry<T = unknown> = { value: T; savedAt: number };

let dbPromise: Promise<IDBDatabase> | null = null;

function canUseIdb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  if (!canUseIdb()) {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
    });
  }
  return dbPromise;
}

export async function offlineCachePut(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    const payload: Entry = { value, savedAt: Date.now() };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IDB write failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IDB write aborted"));
      tx.objectStore(STORE).put(payload, key);
    });
  } catch {
    /* 저장 실패는 치명적이지 않음 */
  }
}

export async function offlineCacheGet<T>(
  key: string,
): Promise<{ value: T; savedAt: number } | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => {
        const raw = req.result as Entry<T> | undefined;
        if (!raw || raw.value === undefined) {
          resolve(null);
          return;
        }
        resolve({ value: raw.value, savedAt: raw.savedAt });
      };
      req.onerror = () => reject(req.error ?? new Error("IDB read failed"));
    });
  } catch {
    return null;
  }
}
