// Thin wrapper around the artifact's persistent window.storage API.
// Falls back to an in-memory map during local dev (window.storage is only
// injected inside the claude.ai artifact runtime).

type StorageResult<T> = { key: string; value: T; shared: boolean } | null;

const memoryFallback = new Map<string, string>();

function hasNativeStorage(): boolean {
  return typeof window !== 'undefined' && !!(window as any).storage;
}

export async function storageGet<T = any>(key: string, shared = false): Promise<T | null> {
  try {
    if (hasNativeStorage()) {
      const res: StorageResult<string> = await (window as any).storage.get(key, shared);
      if (!res) return null;
      return JSON.parse(res.value) as T;
    }
    const raw = memoryFallback.get(`${shared ? 'shared:' : 'me:'}${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function storageSet<T = any>(key: string, value: T, shared = false): Promise<boolean> {
  try {
    const payload = JSON.stringify(value);
    if (hasNativeStorage()) {
      const res = await (window as any).storage.set(key, payload, shared);
      return !!res;
    }
    memoryFallback.set(`${shared ? 'shared:' : 'me:'}${key}`, payload);
    return true;
  } catch {
    return false;
  }
}

export async function storageList(prefix = '', shared = false): Promise<string[]> {
  try {
    if (hasNativeStorage()) {
      const res = await (window as any).storage.list(prefix, shared);
      return res?.keys ?? [];
    }
    const tag = shared ? 'shared:' : 'me:';
    return Array.from(memoryFallback.keys())
      .filter((k) => k.startsWith(tag + prefix))
      .map((k) => k.slice(tag.length));
  } catch {
    return [];
  }
}
