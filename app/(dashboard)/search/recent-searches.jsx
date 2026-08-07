"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const STORAGE_KEY = "crm-recent-searches-v1";
const MAX_RECENT = 8;

export function loadRecent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Records the current query in localStorage once results have loaded for it. */
export function useRecordRecentSearch(query) {
  useEffect(() => {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const existing = loadRecent().filter((term) => term.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...existing].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }, [query]);
}

/** Renders nothing — just records `query` as a recent search once it lands. */
export function RecordSearch({ query }) {
  useRecordRecentSearch(query);
  return null;
}

/** Shown when there's no active query — recent terms as one-click chips. */
export function RecentSearches() {
  const router = useRouter();
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    // localStorage isn't available during SSR — this has to run post-mount,
    // matching the server's empty-array render first to avoid a hydration
    // mismatch, then filling in from the real value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(loadRecent());
  }, []);

  if (recent.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="mb-2 text-caption font-medium text-muted-foreground">Recent searches</p>
      <div className="flex flex-wrap gap-2">
        {recent.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-caption transition-colors hover:bg-accent focus-ring"
          >
            <Search aria-hidden="true" className="size-3.5 text-muted-foreground" />
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
