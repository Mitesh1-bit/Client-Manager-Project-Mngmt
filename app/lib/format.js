/**
 * Formatting helpers.
 *
 * Locale and time zone are pinned deliberately. These run in both Server and
 * Client Components, and `toLocaleDateString(undefined, …)` resolves against a
 * different locale on the server than in the browser, which produces hydration
 * mismatches. Pinning makes the output identical in both places.
 *
 * Org-level locale/currency settings would replace the constants here — see
 * NEEDED_SCHEMA_CHANGES.md §5.
 */

const LOCALE = "en-GB";
const TIME_ZONE = "UTC";
const CURRENCY = "GBP";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

/**
 * Date-only values (`2026-09-05`) are parsed as UTC midnight so they never
 * shift a day backwards in a negative-offset time zone.
 *
 * @param {string | Date | null | undefined} value
 */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value, fallback = "—") {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : fallback;
}

export function formatDateTime(value, fallback = "—") {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : fallback;
}

export function formatCurrency(value, fallback = "—") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  return currencyFormatter.format(Number(value));
}

export function formatNumber(value, fallback = "—") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  return new Intl.NumberFormat(LOCALE).format(Number(value));
}

export function formatBytes(bytes, fallback = "—") {
  if (!Number.isFinite(bytes) || bytes < 0) return fallback;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size >= 10 || Number.isInteger(size) ? Math.round(size) : size.toFixed(1)} ${units[unit]}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Day-granularity relative time. Coarse on purpose: it has to produce the same
 * string on the server and a moment later in the browser.
 *
 * @param {string | Date | null | undefined} value
 * @param {Date | number} [now]
 */
export function formatRelativeDays(value, now = Date.now()) {
  const date = toDate(value);
  if (!date) return "—";

  const startOfDay = (input) => {
    const copy = new Date(input);
    copy.setUTCHours(0, 0, 0, 0);
    return copy.getTime();
  };

  const days = Math.round((startOfDay(date) - startOfDay(new Date(now))) / DAY_MS);

  if (days === 0) return "today";
  if (days === -1) return "yesterday";
  if (days === 1) return "tomorrow";
  if (days < 0 && days >= -6) return `${Math.abs(days)} days ago`;
  if (days > 0 && days <= 6) return `in ${days} days`;
  if (days < 0 && days >= -30) return `${plural(Math.floor(Math.abs(days) / 7), "week")} ago`;
  if (days > 0 && days <= 30) return `in ${plural(Math.floor(days / 7), "week")}`;
  return formatDate(date);
}

function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** `SCOPE_ADDITION` → `Scope addition`, for enum values with no badge of their own. */
export function humanizeType(value) {
  if (!value) return "—";
  const lower = String(value).toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * "MB" from "Marcus Bell" — avatar fallbacks and dense table cells.
 * Words that don't start with a letter or digit are skipped, so
 * "Sable & Finch" reads as "SF" rather than "S&".
 */
export function initials(name, max = 2) {
  return String(name ?? "")
    .split(/\s+/)
    .filter((part) => /^[\p{L}\p{N}]/u.test(part))
    .slice(0, max)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/** Strips the protocol so links read as `northwind.health`, not the full URL. */
export function displayUrl(url) {
  if (!url) return null;
  return String(url).replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
