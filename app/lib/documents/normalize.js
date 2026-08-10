import { canOpenPreview, getDocumentCategory } from "./category";

/**
 * Normalize mock documents, GraphQL DocumentFields, or CR attachment rows
 * into a shape the document viewer understands.
 *
 * @param {Record<string, unknown> | null | undefined} record
 */
export function normalizeDocumentRecord(record) {
  if (!record) return null;

  const fileUrl = String(record.fileUrl ?? record.file_url ?? "");
  const filename =
    record.filename ??
    record.name ??
    (fileUrl ? fileUrl.split("/").pop() : "Document");
  const contentType = record.contentType ?? record.mimeType ?? record.content_type ?? "";
  const sizeBytes = Number(record.sizeBytes ?? record.size_bytes ?? 0) || 0;
  const category =
    record.category ?? getDocumentCategory({ filename: String(filename), contentType: String(contentType) });

  return {
    ...record,
    id: record.id,
    fileUrl,
    filename: String(filename),
    contentType: String(contentType),
    sizeBytes,
    version: record.version ?? 1,
    createdAt: record.createdAt ?? record.created_at ?? null,
    uploadedByName: record.uploadedByName ?? record.uploaded_by_name ?? null,
    thumbnailUrl: record.thumbnailUrl ?? record.thumbnail_url ?? null,
    previewPath: record.previewPath ?? record.preview_path ?? null,
    category,
    canPreview:
      typeof record.canPreview === "boolean"
        ? record.canPreview
        : canOpenPreview({ filename: String(filename), contentType: String(contentType), category }),
  };
}

/**
 * @param {unknown} records
 */
export function normalizeDocumentRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map(normalizeDocumentRecord).filter(Boolean);
}
