"use client";

import { formatDocumentDate, formatFileSize } from "@/app/lib/documents/format";
import { categoryLabel, getDocumentCategory } from "@/app/lib/documents/category";
import { DocumentActions } from "./document-actions";
import { DocumentThumbnail } from "./document-thumbnail";

/**
 * @param {{
 *   document: object;
 *   onView: (document: object) => void;
 *   onDelete?: (document: object) => void;
 *   canDelete?: boolean;
 * }} props
 */
export function DocumentRow({ document, onView, onDelete, canDelete = false }) {
  const category = getDocumentCategory(document);

  return (
    <li className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-shadow hover:shadow-card">
      <button
        type="button"
        onClick={() => onView(document)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-ring"
      >
        <DocumentThumbnail document={document} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{document.filename}</span>
          <span className="block truncate text-caption text-muted-foreground">
            {categoryLabel(category)} · {formatFileSize(document.sizeBytes)} · v{document.version}
            {document.uploadedByName ? ` · ${document.uploadedByName}` : ""} · {formatDocumentDate(document.createdAt)}
          </span>
        </span>
      </button>
      <DocumentActions
        compact
        document={document}
        onView={() => onView(document)}
        onDelete={onDelete ? () => onDelete(document) : undefined}
        canDelete={canDelete}
      />
    </li>
  );
}
