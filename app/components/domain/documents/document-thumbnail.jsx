"use client";

import { DocumentLanguageBadge, DocumentTypeIcon } from "./document-type-icon";
import { documentThumbnailUrl } from "@/app/lib/documents/urls";

/**
 * @param {{ document: { thumbnailUrl?: string | null; filename?: string; category?: string }; size?: "sm" | "md" | "lg"; className?: string }} props
 */
export function DocumentThumbnail({ document, size = "md", className = "" }) {
  const sizes = {
    sm: "size-10 rounded-xl",
    md: "size-14 rounded-xl",
    lg: "size-full min-h-[140px] rounded-2xl",
  };
  const thumbSrc = documentThumbnailUrl(document.thumbnailUrl);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border bg-muted/60 text-muted-foreground ${sizes[size]} ${className}`}
    >
      {thumbSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbSrc} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <>
          <DocumentTypeIcon document={document} className={size === "lg" ? "size-8" : "size-4.5"} />
          <span className="absolute bottom-1 right-1">
            <DocumentLanguageBadge document={document} />
          </span>
        </>
      )}
    </div>
  );
}
