"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/app/components/ui/button";
import { normalizeDocumentRecords } from "@/app/lib/documents/normalize";
import { DocumentRow } from "./document-row";
import { DocumentViewerModal } from "./document-viewer-lazy";

/**
 * Lightweight document list for embedded contexts (CR attachments, milestone
 * deliverables, portal overview snippets). Loads the heavy viewer on demand.
 *
 * @param {{
 *   documents: object[];
 *   maxItems?: number;
 *   viewAllHref?: string;
 *   viewAllLabel?: string;
 *   className?: string;
 *   canDelete?: (document: object) => boolean;
 *   onDelete?: (document: object) => void;
 * }} props
 */
export function DocumentEmbedPanel({
  documents,
  maxItems,
  viewAllHref,
  viewAllLabel = "View all files",
  className = "",
  canDelete,
  onDelete,
}) {
  const normalized = useMemo(() => normalizeDocumentRecords(documents), [documents]);
  const visible = maxItems ? normalized.slice(0, maxItems) : normalized;
  const [activeDocument, setActiveDocument] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  if (normalized.length === 0) return null;

  function openViewer(document) {
    setActiveDocument(document);
    setViewerOpen(true);
  }

  return (
    <>
      <ul className={`space-y-1.5 ${className}`.trim()}>
        {visible.map((document) => (
          <DocumentRow
            key={document.id}
            document={document}
            onView={openViewer}
            onDelete={onDelete}
            canDelete={canDelete?.(document) ?? false}
          />
        ))}
      </ul>

      {viewAllHref && normalized.length > (maxItems ?? normalized.length) ? (
        <Button variant="ghost" size="sm" className="mt-2" asChild>
          <Link href={viewAllHref}>{viewAllLabel}</Link>
        </Button>
      ) : null}

      {viewerOpen ? (
        <DocumentViewerModal
          documents={normalized}
          activeDocument={activeDocument}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          onNavigate={setActiveDocument}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      ) : null}
    </>
  );
}
