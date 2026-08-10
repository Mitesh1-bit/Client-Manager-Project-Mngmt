/**
 * @param {string} fileUrl
 * @param {"inline" | "attachment"} [disposition="attachment"]
 */
export function documentDownloadUrl(fileUrl, disposition = "attachment") {
  return `/api/backend/assets/download?path=${encodeURIComponent(fileUrl)}&disposition=${disposition}`;
}

/**
 * @param {string | null | undefined} thumbnailUrl
 */
export function documentThumbnailUrl(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  return `/api/backend/assets/thumbnail?path=${encodeURIComponent(thumbnailUrl)}`;
}

/**
 * @param {string} documentId
 * @param {"inline" | "attachment"} [disposition="inline"]
 */
export function documentPreviewByIdUrl(documentId, disposition = "inline") {
  return `/api/backend/assets/preview/${documentId}?disposition=${disposition}`;
}

/**
 * @param {string} documentId
 */
export function archiveEntriesUrl(documentId) {
  return `/api/backend/assets/archive/${documentId}/entries`;
}

/**
 * @param {string} fileUrl
 * @param {"inline" | "attachment"} [disposition="inline"]
 */
export function documentViewUrl(fileUrl, disposition = "inline") {
  return documentDownloadUrl(fileUrl, disposition);
}
