import { MarketingAnalytics } from "@/app/components/marketing/marketing-analytics";
import { MarketingFooter } from "@/app/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/app/components/marketing/marketing-navbar";
import { MarketingSmoothScroll } from "@/app/components/marketing/marketing-smooth-scroll";
import { JsonLd, organizationJsonLd, webSiteJsonLd } from "@/app/components/marketing/json-ld";
import { mktFontClassName } from "@/app/lib/marketing/fonts";
import { SITE_DESCRIPTION, SITE_NAME, metadataBase } from "@/app/lib/marketing/site";

export const metadata = {
  metadataBase: new URL(metadataBase),
  title: {
    default: `${SITE_NAME} — ${SITE_DESCRIPTION.split(".")[0]}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
  },
};

export default function MarketingLayout({ children }) {
  return (
    <MarketingSmoothScroll>
      <div
        data-surface="marketing"
        className={`${mktFontClassName} flex min-h-full flex-col`}
      >
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={webSiteJsonLd()} />
        <MarketingAnalytics />
        <MarketingNavbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </MarketingSmoothScroll>
  );
}
