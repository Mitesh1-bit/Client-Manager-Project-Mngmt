"use client";

import { formatDocumentDate, formatFileSize } from "@/app/lib/documents/format";
import { categoryLabel, getDocumentCategory } from "@/app/lib/documents/category";
import { DocumentThumbnail } from "./document-thumbnail";
import { Eye, Download } from "lucide-react";
import { documentDownloadUrl } from "@/app/lib/documents/urls";

/**
 * @param {{ document: object; onView: (document: object) => void }} props
 */
export function DocumentCard({ document, onView }) {
  const category = getDocumentCategory(document);

  return (
    <button
      type="button"
      onClick={() => onView(document)}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-shadow hover:shadow-card focus-ring"
    >
      <div className="relative aspect-[4/3] border-b bg-muted/20 p-3">
        <DocumentThumbnail document={document} size="lg" className="size-full border-0" />
        <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
            <Eye className="size-3.5" /> View
          </span>
          <a
            href={documentDownloadUrl(document.fileUrl, "attachment")}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium"
          >
            <Download className="size-3.5" /> Save
          </a>
        </div>
      </div>
      <div className="space-y-1 p-3.5">
        <p className="truncate font-medium">{document.filename}</p>
        <p className="truncate text-caption text-muted-foreground">
          {categoryLabel(category)} · {formatFileSize(document.sizeBytes)} · v{document.version}
        </p>
        <p className="truncate text-caption text-muted-foreground">
          {document.uploadedByName || "Unknown"} · {formatDocumentDate(document.createdAt)}
        </p>
      </div>
    </button>
  );
}
