import prettyBytes from "pretty-bytes";

/**
 * @param {number | null | undefined} bytes
 */
export function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  return prettyBytes(bytes);
}

/** Fixed locale so SSR and client render the same date string. */
const DOCUMENT_DATE_LOCALE = "en-US";

/**
 * @param {string | null | undefined} iso
 */
export function formatDocumentDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(DOCUMENT_DATE_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * @param {string} filename
 */
export function displayFilename(filename) {
  if (!filename) return "Untitled";
  return filename;
}
