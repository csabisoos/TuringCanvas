/**
 * Recent Files Local Storage Manager
 */

export interface RecentFile {
  id: string;
  name: string;
  lastModified: number;
  machineType: string;
  nodeCount: number;
  json: string;
}

const STORAGE_KEY = 'turingcanvas_recent_files';
const MAX_RECENT_FILES = 10;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export function getRecentFiles(): RecentFile[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as RecentFile[];
    }
    return [];
  } catch {
    return [];
  }
}

export function saveRecentFile(
  name: string,
  json: string,
  machineType: string,
  nodeCount: number
): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const files = getRecentFiles();
    const newFile: RecentFile = {
      id: `file-${String(Date.now())}`,
      name,
      lastModified: Date.now(),
      machineType,
      nodeCount,
      json,
    };

    // Filter out duplicates with exact same json payload
    const filtered = files.filter((f) => f.json !== json);
    const updated = [newFile, ...filtered].slice(0, MAX_RECENT_FILES);
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

export function deleteRecentFile(id: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const files = getRecentFiles().filter((f) => f.id !== id);
    storage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch {
    // Ignore
  }
}

export function clearRecentFiles(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
