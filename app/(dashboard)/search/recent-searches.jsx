"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { History, Search } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";

import { clearRecentSearches, getRecentSearches, subscribeRecentSearches } from "./recent-searches-store";

export function RecentSearches() {
  const router = useRouter();
  const terms = useSyncExternalStore(subscribeRecentSearches, getRecentSearches, getRecentSearches);

  if (!terms.length) {
    return (
      <EmptyState
        icon={Search}
        title="Start typing to search"
        description="Find a company, contact, project or task by name."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-caption font-medium text-muted-foreground">Recent searches</p>
        <Button variant="ghost" size="sm" onClick={clearRecentSearches}>
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {terms.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-caption transition-colors hover:bg-accent focus-ring"
          >
            <History aria-hidden="true" className="size-3.5 text-muted-foreground" />
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
