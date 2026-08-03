import { renderOgImage, ogImageContentType, ogImageSize } from "@/app/lib/marketing/og-image";

export const alt = "Meridian solutions by role";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({
    title: "Agency solutions by role",
    subtitle: "Workflows for account managers, PMs, leadership, and client partners.",
    eyebrow: "Solutions",
  });
}
