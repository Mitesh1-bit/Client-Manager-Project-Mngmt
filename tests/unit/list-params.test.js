import { describe, expect, it } from "vitest";

import {
  buildQuery,
  hasActiveFilters,
  parseListParams,
  readList,
  sortToParams,
} from "@/app/lib/list-params";

const config = { sortable: ["name", "status", "updatedAt"], defaultSort: "name" };

describe("parseListParams", () => {
  it("falls back to the default sort when the URL asks for an unsortable column", () => {
    const { pageInput, sort } = parseListParams({ sort: "secretColumn" }, config);
    expect(pageInput.sortBy).toBe("name");
    expect(sort).toEqual({ id: "name", desc: false });
  });

  it("reads direction and page", () => {
    const { pageInput, page } = parseListParams({ sort: "updatedAt", dir: "desc", page: "3" }, config);
    expect(pageInput).toMatchObject({ sortBy: "updatedAt", sortDirection: "DESC", page: 3 });
    expect(page).toBe(3);
  });

  it("ignores a nonsense page number rather than sending it to the API", () => {
    expect(parseListParams({ page: "0" }, config).page).toBe(1);
    expect(parseListParams({ page: "-4" }, config).page).toBe(1);
    expect(parseListParams({ page: "abc" }, config).page).toBe(1);
  });

  it("reports no sort when there is no default", () => {
    const { sort, pageInput } = parseListParams({}, { sortable: ["name"] });
    expect(sort).toBeNull();
    expect(pageInput.sortBy).toBeNull();
  });
});

describe("readList", () => {
  it("splits, trims and de-duplicates", () => {
    expect(readList({ status: "ACTIVE, PAUSED ,ACTIVE" }, "status")).toEqual(["ACTIVE", "PAUSED"]);
  });

  it("returns an empty array for a missing or blank param", () => {
    expect(readList({}, "status")).toEqual([]);
    expect(readList({ status: "" }, "status")).toEqual([]);
  });
});

describe("buildQuery", () => {
  it("merges a patch over the current params", () => {
    expect(buildQuery({ q: "north", status: "ACTIVE" }, { status: "PAUSED" })).toBe(
      "?q=north&status=PAUSED",
    );
  });

  it("drops keys set to null or empty", () => {
    expect(buildQuery({ q: "north", status: "ACTIVE" }, { q: null })).toBe("?status=ACTIVE");
    expect(buildQuery({ q: "north" }, { q: "" })).toBe("");
  });

  it("joins array values", () => {
    expect(buildQuery({}, { status: ["ACTIVE", "LEAD"] })).toBe("?status=ACTIVE%2CLEAD");
  });

  it("resets to page 1 when a filter changes", () => {
    // Landing on page 4 of a freshly filtered list is never what was meant.
    expect(buildQuery({ page: "4", status: "ACTIVE" }, { q: "north" })).toBe(
      "?status=ACTIVE&q=north",
    );
  });

  it("keeps the page when the page itself is what changed", () => {
    expect(buildQuery({ status: "ACTIVE" }, { page: 2 })).toBe("?status=ACTIVE&page=2");
  });

  it("omits page=1 rather than putting it in the URL", () => {
    expect(buildQuery({ status: "ACTIVE" }, { page: 1 })).toBe("?status=ACTIVE");
  });

  it("accepts URLSearchParams as the current params", () => {
    const current = new URLSearchParams("q=north&page=2");
    expect(buildQuery(current, { page: 3 })).toBe("?q=north&page=3");
  });
});

describe("sortToParams", () => {
  it("maps a sort state to URL params", () => {
    expect(sortToParams({ id: "name", desc: false })).toEqual({ sort: "name", dir: null });
    expect(sortToParams({ id: "name", desc: true })).toEqual({ sort: "name", dir: "desc" });
    expect(sortToParams(null)).toEqual({ sort: null, dir: null });
  });
});

describe("hasActiveFilters", () => {
  const keys = ["q", "status", "tag", "owner"];

  it("ignores paging and sorting", () => {
    expect(hasActiveFilters({ page: "2", sort: "name" }, keys)).toBe(false);
  });

  it("detects any filter", () => {
    expect(hasActiveFilters({ q: "north" }, keys)).toBe(true);
    expect(hasActiveFilters({ owner: "usr_1" }, keys)).toBe(true);
    expect(hasActiveFilters({ q: "   " }, keys)).toBe(false);
  });
});
