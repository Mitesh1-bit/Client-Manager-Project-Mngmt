"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { buildQuery, readString } from "@/app/lib/list-params";

import { pushRecentSearch } from "./recent-searches-store";

const SEARCH_DEBOUNCE_MS = 300;

export function SearchField() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQuery = readString(searchParams, "q") ?? "";
  const [value, setValue] = useState(currentQuery);
  const [isPending, setIsPending] = useState(false);
  const debounceRef = useRef(null);

  const [urlQuery, setUrlQuery] = useState(currentQuery);
  if (urlQuery !== currentQuery) {
    setUrlQuery(currentQuery);
    setValue(currentQuery);
  }

  function navigate(next) {
    // `buildQuery` returns "" once the last param is cleared — anchor to the
    // pathname explicitly rather than pushing an empty href.
    router.push(`${pathname}${buildQuery(searchParams, { q: next || null })}`, { scroll: false });
  }

  function handleChange(event) {
    const next = event.target.value;
    setValue(next);

    clearTimeout(debounceRef.current);
    if (next === currentQuery) {
      setIsPending(false);
      return;
    }
    setIsPending(true);
    debounceRef.current = setTimeout(() => {
      setIsPending(false);
      navigate(next);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleBlur() {
    if (value.trim()) pushRecentSearch(value.trim());
  }

  function handleClear() {
    clearTimeout(debounceRef.current);
    setValue("");
    setIsPending(false);
    navigate("");
  }

  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        autoFocus
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Search companies, contacts, projects, tasks…"
        aria-label="Search"
        className="h-12 rounded-xl border-2 pr-10 pl-10 text-body"
      />
      {isPending ? (
        <LoaderCircle
          aria-hidden="true"
          className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      ) : value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
