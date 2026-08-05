import { Suspense } from "react";

import { mktFontClassName } from "@/app/lib/marketing/fonts";
import { privateAppMetadata } from "@/app/lib/marketing/seo";

import { AuthShell } from "./auth-shell";
import { AuthUrlScrubber } from "./auth-url-scrubber";

export const metadata = privateAppMetadata;

export default function AuthLayout({ children }) {
  return (
    <div
      data-surface="marketing"
      className={`${mktFontClassName} min-h-svh overflow-x-hidden bg-white font-mkt-sans text-mkt-navy antialiased`}
    >
      <Suspense fallback={null}>
        <AuthUrlScrubber />
      </Suspense>
      <AuthShell>{children}</AuthShell>
    </div>
  );
}
