import { CATEGORIES } from "./category";

/** Categories that need a full text fetch before rendering. */
export const TEXT_PREVIEW_CATEGORIES = new Set([
  CATEGORIES.MARKDOWN,
  CATEGORIES.MERMAID,
  CATEGORIES.SVG,
  CATEGORIES.CODE,
  CATEGORIES.TEXT,
  CATEGORIES.CSV,
  CATEGORIES.HTML,
]);

/**
 * Tailwind classes for the document viewer shell — width/height vary by file type.
 *
 * @param {string} category
 */
export function viewerModalClass(category) {
  const base =
    "flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-none sm:rounded-2xl";

  switch (category) {
    case CATEGORIES.AUDIO:
      return `${base} h-auto w-[min(96vw,26rem)]`;
    case CATEGORIES.IMAGE:
    case CATEGORIES.SVG:
      return `${base} h-[min(90dvh,880px)] w-[min(96vw,76rem)]`;
    case CATEGORIES.VIDEO:
      return `${base} h-[min(88dvh,820px)] w-[min(96vw,72rem)]`;
    case CATEGORIES.PDF:
    case CATEGORIES.OFFICE:
    case CATEGORIES.CODE:
    case CATEGORIES.TEXT:
    case CATEGORIES.CSV:
    case CATEGORIES.HTML:
    case CATEGORIES.MARKDOWN:
    case CATEGORIES.MERMAID:
    case CATEGORIES.ARCHIVE:
      return `${base} h-[min(92dvh,960px)] w-[min(98vw,90rem)]`;
    default:
      return `${base} h-[min(88dvh,800px)] w-[min(96vw,64rem)]`;
  }
}

/**
 * @param {string} category
 */
export function needsTextFetch(category) {
  return TEXT_PREVIEW_CATEGORIES.has(category);
}

/**
 * @param {string} category
 */
export function usesDirectUrlPreview(category) {
  return !needsTextFetch(category) && category !== CATEGORIES.ARCHIVE;
}
