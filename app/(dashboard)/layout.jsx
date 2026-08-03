import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { mktFontClassName } from "@/app/lib/marketing/fonts";
import { requireViewer } from "@/app/lib/graphql/viewer";
import { privateAppMetadata } from "@/app/lib/marketing/seo";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

export const metadata = privateAppMetadata;

export default async function DashboardLayout({ children }) {
  const viewer = await requireViewer("INTERNAL");

  return (
    <div data-surface="app" className={`${mktFontClassName} flex min-h-svh flex-1 flex-col`}>
      <SidebarProvider>
        <DashboardSidebar viewer={viewer} organizationName={viewer.organization.name} />
        <SidebarInset className="min-w-0">
          <DashboardTopbar />
          <main id="main" className="page-shell flex-1 py-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
