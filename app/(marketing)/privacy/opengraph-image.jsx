import { renderOgImage, ogImageContentType, ogImageSize } from "@/app/lib/marketing/og-image";

export const alt = "Meridian privacy policy";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({
    title: "Privacy policy",
    subtitle: "How Meridian collects, uses, and protects agency and client portal data.",
    eyebrow: "Legal",
  });
}
