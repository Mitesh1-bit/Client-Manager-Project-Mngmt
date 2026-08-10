"use client";

import dynamic from "next/dynamic";
import { LoaderCircle } from "lucide-react";

function ViewerFallback() {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      Loading viewer…
    </div>
  );
}

export const DocumentViewerModal = dynamic(
  () => import("./document-viewer-modal").then((module) => module.DocumentViewerModal),
  { ssr: false, loading: ViewerFallback },
);
