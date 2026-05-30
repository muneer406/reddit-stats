const CACHE_PREFIX = "rdt_analytics_";
const CACHE_DURATION_MS = 5 * 60 * 1000;

function hashKey(usernames: string[], searchString: string): string {
  const raw = [...usernames].sort().join(",") + "|" + searchString;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return CACHE_PREFIX + Math.abs(hash).toString(36);
}

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
  usernames: string[];
  version: number;
}

const CACHE_VERSION = 1;

export function getCache<T>(usernames: string[], searchString: string): { entry: CacheEntry<T> | null; stale: boolean } {
  try {
    const key = hashKey(usernames, searchString);
    const raw = localStorage.getItem(key);
    if (!raw) return { entry: null, stale: false };
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION) { localStorage.removeItem(key); return { entry: null, stale: false }; }
    const age = Date.now() - entry.timestamp;
    return { entry, stale: age > CACHE_DURATION_MS };
  } catch {
    return { entry: null, stale: false };
  }
}

export function setCache<T>(usernames: string[], searchString: string, data: T): void {
  try {
    const key = hashKey(usernames, searchString);
    const entry: CacheEntry<T> = { timestamp: Date.now(), data, usernames, version: CACHE_VERSION };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn("Cache write failed:", e);
  }
}

export function clearAllCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Cache clear failed:", e);
  }
}
