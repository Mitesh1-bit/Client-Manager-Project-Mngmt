"use client";

import { Download, FileWarning } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { formatFileSize } from "@/app/lib/documents/format";
import { documentDownloadUrl } from "@/app/lib/documents/urls";
import { categoryLabel, getDocumentCategory } from "@/app/lib/documents/category";

/**
 * @param {{ document: { filename?: string; fileUrl: string; sizeBytes?: number; category?: string }; message?: string }} props
 */
export function UnsupportedPreview({ document, message }) {
  const category = getDocumentCategory(document);
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <FileWarning aria-hidden="true" className="size-6" />
      </div>
      <div>
        <p className="font-medium">{document.filename}</p>
        <p className="mt-1 text-caption text-muted-foreground">
          {categoryLabel(category)} · {formatFileSize(document.sizeBytes)}
        </p>
        {message ? <p className="mt-3 max-w-md text-sm text-muted-foreground">{message}</p> : null}
      </div>
      <Button asChild>
        <a href={documentDownloadUrl(document.fileUrl, "attachment")}>
          <Download aria-hidden="true" />
          Download file
        </a>
      </Button>
    </div>
  );
}
