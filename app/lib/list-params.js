/**
 * URL <-> GraphQL variable translation for server-driven list views.
 *
 * The URL is the single source of truth for filtering, sorting and pagination:
 * a Server Component reads `searchParams`, turns them into GraphQL variables,
 * and client controls navigate rather than hold state. That keeps every list
 * shareable, back-button-correct, and refetched on the server.
 *
 * Projects, change requests and touchpoints reuse this — module-specific
 * filters are parsed in the route, everything generic lives here.
 */

export const DEFAULT_PAGE_SIZE = 15;

/** @param {URLSearchParams | Record<string, string | string[] | undefined>} searchParams */
function read(searchParams, key) {
  const value =
    typeof searchParams?.get === "function" ? searchParams.get(key) : searchParams?.[key];
  if (Array.isArray(value)) return value[0];
  return value ?? null;
}

/** Reads a repeatable/comma-separated param into a de-duplicated array. */
export function readList(searchParams, key) {
  const raw = read(searchParams, key);
  if (!raw) return [];
  return [...new Set(raw.split(",").map((part) => part.trim()).filter(Boolean))];
}

export function readString(searchParams, key) {
  const value = read(searchParams, key);
  return value && value.trim() ? value.trim() : null;
}

/**
 * @param {unknown} searchParams
 * @param {{ sortable: string[], defaultSort?: string, defaultDirection?: 'ASC' | 'DESC', pageSize?: number }} config
 */
export function parseListParams(searchParams, config) {
  const { sortable, defaultSort = null, defaultDirection = "ASC", pageSize = DEFAULT_PAGE_SIZE } = config;

  const requestedSort = readString(searchParams, "sort");
  const sortBy = sortable.includes(requestedSort) ? requestedSort : defaultSort;
  const sortDirection = readString(searchParams, "dir") === "desc" ? "DESC" : defaultDirection;

  const requestedPage = Number.parseInt(read(searchParams, "page") ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  return {
    page,
    pageSize,
    // Null when unsorted, so the table header shows no arrow.
    sort: sortBy ? { id: sortBy, desc: sortDirection === "DESC" } : null,
    pageInput: { page, pageSize, sortBy, sortDirection },
  };
}

/**
 * Builds the next query string. Null, undefined and empty values drop the key
 * entirely so URLs stay short and shareable.
 *
 * Changing anything other than the page resets to page 1 — landing on page 4
 * of a freshly filtered list is never what someone meant.
 *
 * @param {unknown} searchParams
 * @param {Record<string, string | string[] | number | null | undefined>} patch
 */
export function buildQuery(searchParams, patch) {
  const next = new URLSearchParams();

  const entries =
    typeof searchParams?.entries === "function"
      ? [...searchParams.entries()]
      : Object.entries(searchParams ?? {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? value[0] : value,
        ]);

  for (const [key, value] of entries) {
    if (value !== undefined && value !== null && value !== "") next.set(key, value);
  }

  for (const [key, value] of Object.entries(patch)) {
    const normalized = Array.isArray(value) ? value.filter(Boolean).join(",") : value;
    if (normalized === null || normalized === undefined || normalized === "") next.delete(key);
    else next.set(key, String(normalized));
  }

  if (!("page" in patch)) next.delete("page");
  if (next.get("page") === "1") next.delete("page");

  const query = next.toString();
  return query ? `?${query}` : "";
}

/** Full App Router href — required when the query string is empty (Clear all). */
export function buildListHref(pathname, searchParams, patch) {
  const query = buildQuery(searchParams, patch);
  return query ? `${pathname}${query}` : pathname;
}

/** @param {{ id: string, desc: boolean } | null} sort */
export function sortToParams(sort) {
  if (!sort) return { sort: null, dir: null };
  return { sort: sort.id, dir: sort.desc ? "desc" : null };
}

/** True when any filter (not just paging or sorting) is applied. */
export function hasActiveFilters(searchParams, filterKeys) {
  return filterKeys.some((key) => {
    const value = read(searchParams, key);
    return Boolean(value && String(value).trim());
  });
}
