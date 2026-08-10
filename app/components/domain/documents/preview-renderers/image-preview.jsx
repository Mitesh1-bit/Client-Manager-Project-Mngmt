"use client";

import { ZoomableView } from "./zoom-controls";

/**
 * @param {{ src: string; alt?: string }} props
 */
export function ImagePreview({ src, alt = "Document preview" }) {
  return (
    <ZoomableView
      contentClassName="flex items-center justify-center"
      className="bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] dark:bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} decoding="async" className="max-h-[78dvh] max-w-full object-contain shadow-card" />
    </ZoomableView>
  );
}
