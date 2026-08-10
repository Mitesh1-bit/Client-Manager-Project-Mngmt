"use client";

import { useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { ZOOM_KEYBOARD_HINT } from "./use-font-zoom";
import { useZoomKeyboard } from "./use-zoom-keyboard";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * @param {{ src: string }} props
 */
export function PdfPreview({ src }) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.1);

  const zoomIn = useCallback(() => {
    setScale((current) => Math.min(2.4, Math.round((current + 0.2) * 10) / 10));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((current) => Math.max(0.6, Math.round((current - 0.2) * 10) / 10));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.1);
  }, []);

  useZoomKeyboard({ onZoomIn: zoomIn, onZoomOut: zoomOut, onReset: resetZoom });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-center gap-2 border-b bg-muted/30 px-3 py-2">
        <Button type="button" variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span className="text-caption text-muted-foreground">
          Page {page} of {numPages || "—"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={page >= numPages}
          onClick={() => setPage((p) => p + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <span className="hidden text-[0.65rem] text-muted-foreground sm:inline">{ZOOM_KEYBOARD_HINT}</span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={zoomOut} aria-label="Zoom out">
          <Minus aria-hidden="true" className="size-3.5" />
        </Button>
        <span className="tabular min-w-[2.5rem] text-center text-[0.65rem] text-muted-foreground">{Math.round(scale * 100)}%</span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={zoomIn} aria-label="Zoom in">
          <Plus aria-hidden="true" className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={resetZoom} aria-label="Reset zoom">
          <Maximize2 aria-hidden="true" className="size-3.5" />
        </Button>
      </div>
      <div className="flex flex-1 justify-center overflow-auto bg-muted/20 p-4">
        <Document file={src} onLoadSuccess={({ numPages: total }) => setNumPages(total)} loading={<p className="p-8 text-caption">Loading PDF…</p>}>
          <Page pageNumber={page} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      </div>
    </div>
  );
}
