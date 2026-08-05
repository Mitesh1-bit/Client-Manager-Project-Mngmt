"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { buildQuery, readList, readString } from "@/app/lib/list-params";
import { cn } from "@/app/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Filter bar for server-driven lists. Every control navigates rather than
 * holding state, so the URL stays the single source of truth (see
 * `app/lib/list-params.js`).
 *
 * @param {{
 *   searchKey?: string,
 *   searchPlaceholder?: string,
 *   searchLabel?: string,
 *   filters: Array<{ key: string, label: string, multi?: boolean, allLabel?: string, options: Array<{ value: string, label: string }> }>,
 *   children?: React.ReactNode,
 * }} props
 */
export function ListToolbar({
  searchKey = "q",
  searchPlaceholder = "Search…",
  searchLabel = "Search",
  filters = [],
  children,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = readString(searchParams, searchKey) ?? "";
  const [search, setSearch] = useState(currentSearch);
  const isFirstRender = useRef(true);

  // Sync when the URL changes from elsewhere (Clear, back button, a shared
  // link). Adjusted during render so the input never paints a stale value.
  const [urlSearch, setUrlSearch] = useState(currentSearch);
  if (urlSearch !== currentSearch) {
    setUrlSearch(currentSearch);
    setSearch(currentSearch);
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (search === currentSearch) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(buildQuery(searchParams, { [searchKey]: search || null }), { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search, currentSearch, searchKey, router, searchParams]);

  function update(patch) {
    startTransition(() => {
      router.push(buildQuery(searchParams, patch), { scroll: false });
    });
  }

  const activeCount =
    (currentSearch ? 1 : 0) +
    filters.reduce((total, filter) => {
      if (filter.multi === false) return total + (readString(searchParams, filter.key) ? 1 : 0);
      return total + readList(searchParams, filter.key).length;
    }, 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 basis-full sm:min-w-56 sm:max-w-xs sm:basis-auto">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          className="h-9 pl-8"
        />
        {isPending ? (
          <LoaderCircle
            aria-hidden="true"
            className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        ) : null}
      </div>

      {filters.map((filter) =>
        filter.multi === false ? (
          <SingleFilter
            key={filter.key}
            filter={filter}
            value={readString(searchParams, filter.key)}
            onChange={(value) => update({ [filter.key]: value })}
          />
        ) : (
          <MultiFilter
            key={filter.key}
            filter={filter}
            values={readList(searchParams, filter.key)}
            onChange={(values) => update({ [filter.key]: values })}
          />
        ),
      )}

      {children}

      {activeCount > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            update({
              [searchKey]: null,
              ...Object.fromEntries(filters.map((filter) => [filter.key, null])),
            })
          }
        >
          <X aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}

function FilterCount({ count }) {
  if (!count) return null;
  return (
    <span className="ml-0.5 rounded bg-primary/10 px-1.5 text-[0.6875rem] text-primary">
      {count}
    </span>
  );
}

function MultiFilter({ filter, values, onChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn(values.length > 0 && "border-primary/40")}>
          {filter.label}
          <FilterCount count={values.length} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>{filter.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filter.options.length === 0 ? (
          <p className="px-2 py-1.5 text-caption text-muted-foreground">Nothing to filter by yet</p>
        ) : (
          filter.options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={values.includes(option.value)}
              onCheckedChange={() =>
                onChange(
                  values.includes(option.value)
                    ? values.filter((item) => item !== option.value)
                    : [...values, option.value],
                )
              }
              onSelect={(event) => event.preventDefault()}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SingleFilter({ filter, value, onChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn(value && "border-primary/40")}>
          {filter.label}
          <FilterCount count={value ? 1 : 0} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{filter.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value ?? ""} onValueChange={(next) => onChange(next || null)}>
          <DropdownMenuRadioItem value="">{filter.allLabel ?? "Any"}</DropdownMenuRadioItem>
          {filter.options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
