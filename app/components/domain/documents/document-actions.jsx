"use client";

import { Download, ExternalLink, Eye, Trash2 } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { documentDownloadUrl } from "@/app/lib/documents/urls";

/**
 * @param {{
 *   document: { fileUrl: string; filename?: string };
 *   onView?: () => void;
 *   onDelete?: () => void;
 *   canDelete?: boolean;
 *   compact?: boolean;
 * }} props
 */
export function DocumentActions({ document, onView, onDelete, canDelete = false, compact = false }) {
  const downloadHref = documentDownloadUrl(document.fileUrl, "attachment");
  const openHref = documentDownloadUrl(document.fileUrl, "inline");

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {onView ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onView} aria-label="View document">
            <Eye aria-hidden="true" />
          </Button>
        ) : null}
        <Button variant="ghost" size="icon-sm" asChild>
          <a href={downloadHref} aria-label="Download document">
            <Download aria-hidden="true" />
          </a>
        </Button>
        {canDelete && onDelete ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete document">
            <Trash2 aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onView ? (
        <Button type="button" variant="outline" size="sm" onClick={onView}>
          <Eye aria-hidden="true" />
          View
        </Button>
      ) : null}
      <Button variant="outline" size="sm" asChild>
        <a href={downloadHref}>
          <Download aria-hidden="true" />
          Download
        </a>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <a href={openHref} target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden="true" />
          Open
        </a>
      </Button>
      {canDelete && onDelete ? (
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      ) : null}
    </div>
  );
}
