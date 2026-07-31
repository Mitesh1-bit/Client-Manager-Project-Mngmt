import { describe, expect, it } from "vitest";

import {
  displayUrl,
  formatBytes,
  formatCurrency,
  formatDate,
  formatRelativeDays,
  humanizeType,
  initials,
} from "@/app/lib/format";

describe("formatDate", () => {
  it("renders a date-only value on the day it names", () => {
    // The failure this guards against: parsing `2026-09-05` as local midnight
    // and rendering "4 Sep" west of UTC.
    expect(formatDate("2026-09-05")).toBe("5 Sept 2026");
  });

  it("falls back for null and unparseable input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not a date")).toBe("—");
    expect(formatDate(null, "Not set")).toBe("Not set");
  });
});

describe("formatRelativeDays", () => {
  const now = new Date("2026-07-29T12:00:00Z");

  it("names the near days", () => {
    expect(formatRelativeDays("2026-07-29T08:00:00Z", now)).toBe("today");
    expect(formatRelativeDays("2026-07-28T23:00:00Z", now)).toBe("yesterday");
    expect(formatRelativeDays("2026-07-30T01:00:00Z", now)).toBe("tomorrow");
  });

  it("counts days, then weeks, in both directions", () => {
    expect(formatRelativeDays("2026-07-25T12:00:00Z", now)).toBe("4 days ago");
    expect(formatRelativeDays("2026-08-02T12:00:00Z", now)).toBe("in 4 days");
    expect(formatRelativeDays("2026-07-10T12:00:00Z", now)).toBe("2 weeks ago");
  });

  it("says one week, not 1 weeks", () => {
    expect(formatRelativeDays("2026-07-22T12:00:00Z", now)).toBe("1 week ago");
    expect(formatRelativeDays("2026-08-05T12:00:00Z", now)).toBe("in 1 week");
  });

  it("switches to an absolute date beyond a month", () => {
    expect(formatRelativeDays("2026-03-02T12:00:00Z", now)).toBe("2 Mar 2026");
  });

  it("is stable across a small clock difference between server and client", () => {
    const serverNow = new Date("2026-07-29T12:00:00Z");
    const clientNow = new Date("2026-07-29T12:00:03Z");
    const value = "2026-07-27T09:30:00Z";
    expect(formatRelativeDays(value, serverNow)).toBe(formatRelativeDays(value, clientNow));
  });
});

describe("formatBytes", () => {
  it("scales through the units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1_572_864)).toBe("1.5 MB");
    expect(formatBytes(20 * 1024 * 1024)).toBe("20 MB");
  });

  it("rejects nonsense sizes", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(null)).toBe("—");
  });
});

describe("formatCurrency", () => {
  it("formats whole pounds", () => {
    expect(formatCurrency(148000)).toBe("£148,000");
    expect(formatCurrency(0)).toBe("£0");
  });

  it("treats missing values as unset, not zero", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Marcus Bell")).toBe("MB");
    expect(initials("Priya")).toBe("P");
    expect(initials("Jean-Luc van der Berg")).toBe("JV");
  });

  it("skips punctuation words so ampersands don't become an initial", () => {
    expect(initials("Sable & Finch")).toBe("SF");
  });

  it("survives empty input", () => {
    expect(initials(null)).toBe("");
    expect(initials("   ")).toBe("");
  });
});

describe("displayUrl", () => {
  it("strips the protocol and trailing slash", () => {
    expect(displayUrl("https://northwind.health/")).toBe("northwind.health");
    expect(displayUrl("http://example.com/about")).toBe("example.com/about");
  });
});

describe("humanizeType", () => {
  it("turns an enum value into a sentence-cased label", () => {
    expect(humanizeType("SCOPE_ADDITION")).toBe("Scope addition");
    expect(humanizeType(null)).toBe("—");
  });
});
