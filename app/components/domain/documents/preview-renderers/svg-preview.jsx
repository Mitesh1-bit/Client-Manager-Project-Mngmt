"use client";

import { useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";

import { ZoomableView } from "./zoom-controls";

/**
 * @param {{ svgText: string }} props
 */
export function SvgPreview({ svgText }) {
  const sanitized = useMemo(
    () =>
      DOMPurify.sanitize(svgText, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ["script", "foreignObject"],
        FORBID_ATTR: ["onload", "onclick", "onerror"],
      }),
    [svgText],
  );

  return (
    <ZoomableView
      className="bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%)] bg-[length:16px_16px] dark:bg-muted/20"
      contentClassName="max-h-[78dvh] max-w-full [&_svg]:h-auto [&_svg]:max-w-full"
    >
      <div dangerouslySetInnerHTML={{ __html: sanitized }} />
    </ZoomableView>
  );
}
