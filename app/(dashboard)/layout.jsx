import { mktFontClassName } from "@/app/lib/marketing/fonts";
import { requireViewer } from "@/app/lib/graphql/viewer";
import { privateAppMetadata } from "@/app/lib/marketing/seo";

import { DashboardAppShell } from "./dashboard-app-shell";

export const metadata = privateAppMetadata;

export default async function DashboardLayout({ children }) {
  const viewer = await requireViewer("INTERNAL");

  return (
    <div data-surface="app" className={`${mktFontClassName} flex min-h-svh flex-1 flex-col`}>
      <DashboardAppShell viewer={viewer} organizationName={viewer.organization.name}>
        {children}
      </DashboardAppShell>
    </div>
  );
}
