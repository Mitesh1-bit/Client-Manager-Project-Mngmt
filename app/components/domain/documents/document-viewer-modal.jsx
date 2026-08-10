"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Download, ExternalLink, LoaderCircle, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { CATEGORIES, categoryLabel, getDocumentCategory } from "@/app/lib/documents/category";
import { fetchDocumentText, resolvePreviewUrl } from "@/app/lib/documents/fetch";
import { formatDocumentDate, formatFileSize } from "@/app/lib/documents/format";
import { documentDownloadUrl } from "@/app/lib/documents/urls";
import { needsTextFetch, viewerModalClass } from "@/app/lib/documents/viewer-layout";
import { cn } from "@/app/lib/utils";
import { DocumentActions } from "./document-actions";
import { UnsupportedPreview } from "./preview-renderers/unsupported-preview";

const MarkdownPreview = dynamic(
  () => import("./preview-renderers/markdown-preview").then((module) => module.MarkdownPreview),
  { ssr: false, loading: () => <PreviewLoading /> },
);
const MermaidPreview = dynamic(
  () => import("./preview-renderers/mermaid-preview").then((module) => module.MermaidPreview),
  { ssr: false, loading: () => <PreviewLoading /> },
);
const SvgPreview = dynamic(
  () => import("./preview-renderers/svg-preview").then((module) => module.SvgPreview),
  { ssr: false, loading: () => <PreviewLoading /> },
);
const ImagePreview = dynamic(
  () => import("./preview-renderers/image-preview").then((module) => module.ImagePreview),
  { ssr: false, loading: () => <PreviewLoading /> },
);
const PdfPreview = dynamic(
  () => import("./preview-renderers/pdf-preview").then((module) => module.PdfPreview),
  { ssr: false, loading: () => <PreviewLoading /> },
);
const AudioPreview = dynamic(
  () => import("./preview-renderers/media-preview").then((module) => module.AudioPreview),
  { ssr: false, loading: () => <PreviewLoading /> },
);
const VideoPreview = dynamic(
  () => import("./preview-renderers/media-preview").then((module) => module.VideoPreview),
  { ssr: false, loading: () => <PreviewLoading /> },
);
const ArchivePreview = dynamic(
  () => import("./preview-renderers/archive-preview").then((module) => module.ArchivePreview),
  { ssr: false, loading: () => <PreviewLoading /> },
);
const MonacoPreview = dynamic(
  () => import("./preview-renderers/code-preview").then((module) => module.MonacoPreview),
  { ssr: false, loading: () => <PreviewLoading /> },
);

function PreviewLoading() {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center gap-2 text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />
      Loading preview…
    </div>
  );
}

/**
 * @param {{
 *   document: object;
 *   previewUrl?: string | null;
 *   textContent?: string;
 *   textLoading?: boolean;
 * }} props
 */
function PreviewBody({ document, previewUrl, textContent, textLoading }) {
  const category = getDocumentCategory(document);

  if (!document.canPreview && category === CATEGORIES.OTHER) {
    return <UnsupportedPreview document={document} message="Preview is not available for this file type." />;
  }

  if (textLoading) {
    return <PreviewLoading />;
  }

  switch (category) {
    case CATEGORIES.MARKDOWN:
      return textContent ? (
        <MarkdownPreview content={textContent} filename={document.filename} />
      ) : (
        <PreviewLoading />
      );
    case CATEGORIES.MERMAID:
      return textContent ? (
        <MermaidPreview source={textContent} standalone />
      ) : (
        <PreviewLoading />
      );
    case CATEGORIES.SVG:
      return textContent ? <SvgPreview svgText={textContent} /> : <PreviewLoading />;
    case CATEGORIES.IMAGE:
      return previewUrl ? (
        <ImagePreview src={previewUrl} alt={document.filename} />
      ) : (
        <PreviewLoading />
      );
    case CATEGORIES.PDF:
    case CATEGORIES.OFFICE:
      return previewUrl ? <PdfPreview src={previewUrl} /> : <PreviewLoading />;
    case CATEGORIES.VIDEO:
      return previewUrl ? <VideoPreview src={previewUrl} /> : <PreviewLoading />;
    case CATEGORIES.AUDIO:
      return previewUrl ? <AudioPreview src={previewUrl} /> : <PreviewLoading />;
    case CATEGORIES.ARCHIVE:
      return <ArchivePreview documentId={document.id} />;
    case CATEGORIES.CODE:
    case CATEGORIES.TEXT:
    case CATEGORIES.CSV:
    case CATEGORIES.HTML:
      return textContent ? (
        <MonacoPreview value={textContent} filename={document.filename} />
      ) : (
        <PreviewLoading />
      );
    default:
      return <UnsupportedPreview document={document} />;
  }
}

/**
 * @param {{
 *   documents: object[];
 *   activeDocument: object | null;
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   onNavigate?: (document: object) => void;
 *   onDelete?: (document: object) => void;
 *   canDelete?: (document: object) => boolean;
 * }} props
 */
export function DocumentViewerModal({
  documents,
  activeDocument,
  open,
  onOpenChange,
  onNavigate,
  onDelete,
  canDelete,
}) {
  const [textLoading, setTextLoading] = useState(false);
  const [error, setError] = useState(null);
  const [textContent, setTextContent] = useState("");
  const abortRef = useRef(null);

  const index = useMemo(
    () => documents.findIndex((doc) => doc.id === activeDocument?.id),
    [documents, activeDocument?.id],
  );

  const category = activeDocument ? getDocumentCategory(activeDocument) : CATEGORIES.OTHER;

  const previewUrl = useMemo(() => {
    if (!activeDocument) return null;
    return resolvePreviewUrl(activeDocument);
  }, [activeDocument]);

  const loadTextPreview = useCallback(async () => {
    if (!activeDocument || !open) return;

    const docCategory = getDocumentCategory(activeDocument);
    if (!needsTextFetch(docCategory)) {
      setTextLoading(false);
      setTextContent("");
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setTextLoading(true);
    setError(null);
    setTextContent("");

    const url = resolvePreviewUrl(activeDocument);

    try {
      const text = await fetchDocumentText(url, controller.signal);
      if (!controller.signal.aborted) {
        setTextContent(text);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      if (!controller.signal.aborted) {
        setTextLoading(false);
      }
    }
  }, [activeDocument, open]);

  useEffect(() => {
    loadTextPreview();
    return () => abortRef.current?.abort();
  }, [loadTextPreview, activeDocument?.id, open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event) {
      if (event.key === "ArrowLeft" && index > 0) onNavigate?.(documents[index - 1]);
      if (event.key === "ArrowRight" && index < documents.length - 1) onNavigate?.(documents[index + 1]);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [documents, index, onNavigate, open]);

  if (!activeDocument) return null;

  const deleteAllowed = canDelete?.(activeDocument);
  const showTextError = error && needsTextFetch(category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="viewer"
        className={cn(viewerModalClass(category), "overflow-hidden")}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-3 pr-12 text-left">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base">{activeDocument.filename}</DialogTitle>
              <DialogDescription className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-caption">
                <span>{categoryLabel(category)}</span>
                <span>{formatFileSize(activeDocument.sizeBytes)}</span>
                <span>v{activeDocument.version}</span>
                {activeDocument.uploadedByName ? <span>{activeDocument.uploadedByName}</span> : null}
                <span>{formatDocumentDate(activeDocument.createdAt)}</span>
              </DialogDescription>
            </div>
            <DocumentActions
              compact
              document={activeDocument}
              canDelete={deleteAllowed}
              onDelete={onDelete ? () => onDelete(activeDocument) : undefined}
            />
          </div>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-background">
          {showTextError ? (
            <UnsupportedPreview document={activeDocument} message={error} />
          ) : (
            <PreviewBody
              document={activeDocument}
              previewUrl={previewUrl}
              textContent={textContent}
              textLoading={textLoading && needsTextFetch(category)}
            />
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={index <= 0}
              onClick={() => onNavigate?.(documents[index - 1])}
            >
              <ChevronLeft aria-hidden="true" />
              Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={index < 0 || index >= documents.length - 1}
              onClick={() => onNavigate?.(documents[index + 1])}
            >
              Next
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={documentDownloadUrl(activeDocument.fileUrl, "attachment")}>
                <Download aria-hidden="true" />
                Download
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={documentDownloadUrl(activeDocument.fileUrl, "inline")} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" />
                Open tab
              </a>
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="Close">
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
