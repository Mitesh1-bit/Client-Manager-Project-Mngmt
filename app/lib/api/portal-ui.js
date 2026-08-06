/** Client portal UI helpers — downloads, labels, document names. */

/** Authenticated download URL for portal file links. */
export function portalDocumentHref(fileUrl) {
  if (!fileUrl) return "#";
  if (fileUrl.startsWith("/api/backend/assets/download")) return fileUrl;
  return `/api/backend/assets/download?path=${encodeURIComponent(fileUrl)}`;
}

/** Human-readable filename from a stored path or URL. */
export function portalDocumentName(fileUrl, fallback = "Document") {
  if (!fileUrl) return fallback;
  const segment = fileUrl.split("/").pop() ?? fallback;
  try {
    return decodeURIComponent(segment.replace(/\+/g, " "));
  } catch {
    return segment;
  }
}

/** Plain-language entity labels for documents list. */
export function portalEntityLabel(entityType) {
  const labels = {
    company: "Company file",
    project: "Project file",
    milestone: "Milestone deliverable",
    change_request: "Change request attachment",
    contract: "Contract",
    invoice: "Invoice",
  };
  return labels[String(entityType ?? "").toLowerCase()] ?? "Shared file";
}
