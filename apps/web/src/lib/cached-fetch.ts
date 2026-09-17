const MEMORY_CACHE = new Map<string, { t: number; v: unknown }>();

export function cachedJson<T>(key: string, ttlMs: number): T | undefined {
  try {
    const hit = MEMORY_CACHE.get(key);
    if (hit && Date.now() - hit.t <= ttlMs) return hit.v as T;
    if (hit) MEMORY_CACHE.delete(key);
    if (typeof window === "undefined") return undefined;
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.t !== "number" || Date.now() - parsed.t > ttlMs) {
      sessionStorage.removeItem(key);
      return undefined;
    }
    return parsed.v as T;
  } catch {
    return undefined;
  }
}

export function setCachedJson(key: string, value: unknown): void {
  const entry = { t: Date.now(), v: value };
  try {
    MEMORY_CACHE.set(key, entry);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(key, JSON.stringify(entry));
    }
  } catch {
    // storage lleno o indisponible: el caché en memoria sigue funcionando
  }
}