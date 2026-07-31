/**
 * Client-side pagination/filter/sort for flat GraphQL list responses.
 * Used while the backend exposes arrays instead of Connection types.
 */

export const DEFAULT_PAGE_SIZE = 15;

/** @param {number} total @param {number} page @param {number} pageSize */
export function buildPageInfo(total, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * @template T
 * @param {T[]} items
 * @param {{ page?: number, pageSize?: number, sortBy?: string | null, sortDirection?: 'ASC' | 'DESC' }} pageInput
 */
export function paginateList(items, pageInput = {}) {
  const page = pageInput.page && pageInput.page > 0 ? pageInput.page : 1;
  const pageSize = pageInput.pageSize && pageInput.pageSize > 0 ? pageInput.pageSize : DEFAULT_PAGE_SIZE;
  const sortBy = pageInput.sortBy ?? null;
  const sortDirection = pageInput.sortDirection === "DESC" ? "DESC" : "ASC";

  let sorted = [...items];
  if (sortBy) {
    sorted.sort((a, b) => {
      const left = a?.[sortBy];
      const right = b?.[sortBy];
      if (left == null && right == null) return 0;
      if (left == null) return 1;
      if (right == null) return -1;
      if (typeof left === "number" && typeof right === "number") {
        return sortDirection === "DESC" ? right - left : left - right;
      }
      const cmp = String(left).localeCompare(String(right), undefined, { sensitivity: "base" });
      return sortDirection === "DESC" ? -cmp : cmp;
    });
  }

  const totalCount = sorted.length;
  const start = (page - 1) * pageSize;
  const nodes = sorted.slice(start, start + pageSize);

  return {
    totalCount,
    pageInfo: buildPageInfo(totalCount, page, pageSize),
    nodes,
  };
}

/** @param {string | null | undefined} query @param {string[]} fields */
export function matchesSearch(row, query, fields) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some((field) => {
    const value = field.split(".").reduce((acc, key) => acc?.[key], row);
    return value != null && String(value).toLowerCase().includes(needle);
  });
}
