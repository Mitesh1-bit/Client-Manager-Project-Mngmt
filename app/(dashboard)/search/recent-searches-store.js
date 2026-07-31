const STORAGE_KEY = "meridian:recent-searches";
const MAX_ENTRIES = 6;
const EMPTY = [];

// Cached so `useSyncExternalStore` gets a reference-stable snapshot between
// renders — only re-read from localStorage when a push/clear actually occurs.
let cached = null;
const listeners = new Set();

function readFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function notify() {
  cached = null;
  for (const listener of listeners) listener();
}

export function getRecentSearches() {
  if (typeof window === "undefined") return EMPTY;
  if (cached === null) cached = readFromStorage();
  return cached;
}

export function subscribeRecentSearches(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function pushRecentSearch(term) {
  if (typeof window === "undefined" || !term) return;
  const deduped = getRecentSearches().filter(
    (existing) => existing.toLowerCase() !== term.toLowerCase(),
  );
  const next = [term, ...deduped].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notify();
}
