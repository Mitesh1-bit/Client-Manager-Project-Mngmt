import { renderOgImage, ogImageContentType, ogImageSize } from "@/app/lib/marketing/og-image";

export const alt = "Meridian product — agency delivery platform";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({
    title: "The agency delivery stack",
    subtitle: "Companies, projects, change requests, client portal, and retention on one graph.",
    eyebrow: "Product",
  });
}
