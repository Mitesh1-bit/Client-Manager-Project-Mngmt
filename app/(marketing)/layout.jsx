import { MarketingMotionProvider } from "@/app/components/marketing/marketing-motion-provider";
import { MarketingAnalytics } from "@/app/components/marketing/marketing-analytics";
import { MarketingFooter } from "@/app/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/app/components/marketing/marketing-navbar";
import { MarketingSmoothScroll } from "@/app/components/marketing/marketing-smooth-scroll";
import { JsonLd, organizationJsonLd, webSiteJsonLd } from "@/app/components/marketing/json-ld";
import { mktFontClassName } from "@/app/lib/marketing/fonts";
import { defaultSiteMetadata } from "@/app/lib/marketing/seo";

export const metadata = defaultSiteMetadata;

export default function MarketingLayout({ children }) {
  return (
    <MarketingMotionProvider>
      <MarketingSmoothScroll>
        <div
          data-surface="marketing"
          className={`${mktFontClassName} flex min-h-full flex-col overflow-x-hidden`}
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
    </MarketingMotionProvider>
  );
}
