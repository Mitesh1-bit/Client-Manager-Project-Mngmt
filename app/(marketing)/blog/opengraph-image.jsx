import { renderOgImage, ogImageContentType, ogImageSize } from "@/app/lib/marketing/og-image";

export const alt = "Meridian product guides";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({
    title: "Product guides for agencies",
    subtitle: "Change requests, health scores, and delivery workflows explained.",
    eyebrow: "Guides",
  });
}
