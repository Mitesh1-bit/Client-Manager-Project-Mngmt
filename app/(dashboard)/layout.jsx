import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

export default async function DashboardLayout({ children }) {
  const viewer = await requireViewer("INTERNAL");

  return (
    <SidebarProvider>
      <DashboardSidebar viewer={viewer} organizationName={viewer.organization.name} />
      <SidebarInset className="min-w-0">
        <DashboardTopbar />
        <main id="main" className="page-shell flex-1 py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
