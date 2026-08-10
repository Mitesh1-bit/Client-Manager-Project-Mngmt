import { documentViewUrl } from "./urls";

const MAX_CODE_BYTES = 2 * 1024 * 1024;

/**
 * @param {string} url
 * @param {AbortSignal} [signal]
 */
export async function fetchDocumentText(url, signal) {
  const response = await fetch(url, {
    credentials: "include",
    cache: "default",
    signal,
  });
  if (!response.ok) {
    throw new Error(`Could not load file (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (buffer.byteLength > MAX_CODE_BYTES) {
    throw new Error("File is too large to preview in the browser");
  }
  if (isBinaryBuffer(buffer)) {
    throw new Error("This file does not appear to be text");
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

/**
 * @param {{ fileUrl: string; id?: string; previewPath?: string | null; category?: string }} document
 */
export function resolvePreviewUrl(document) {
  if (document.previewPath && document.category === "office") {
    return documentViewUrl(document.previewPath, "inline");
  }
  return documentViewUrl(document.fileUrl, "inline");
}

/**
 * @param {string} documentId
 * @param {AbortSignal} [signal]
 */
export async function fetchArchiveEntries(documentId, signal) {
  const response = await fetch(`/api/backend/assets/archive/${documentId}/entries`, {
    credentials: "include",
    cache: "default",
    signal,
  });
  if (!response.ok) throw new Error("Could not read archive");
  const data = await response.json();
  return data.entries || [];
}

/**
 * @param {ArrayBuffer} buffer
 */
function isBinaryBuffer(buffer) {
  const view = new Uint8Array(buffer.slice(0, 8192));
  return view.includes(0);
}
