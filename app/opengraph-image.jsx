import { renderOgImage, ogImageContentType, ogImageSize } from "@/app/lib/marketing/og-image";
import { SITE_NAME, SITE_TAGLINE } from "@/app/lib/marketing/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({
    title: SITE_TAGLINE,
    subtitle: "Clients, projects, change requests, portal approvals, and retention in one platform.",
  });
}
