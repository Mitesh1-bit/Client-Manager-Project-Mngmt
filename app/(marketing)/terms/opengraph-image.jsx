import { renderOgImage, ogImageContentType, ogImageSize } from "@/app/lib/marketing/og-image";

export const alt = "Meridian terms of service";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({
    title: "Terms of service",
    subtitle: "Terms for agency accounts, acceptable use, and client portal access.",
    eyebrow: "Legal",
  });
}
