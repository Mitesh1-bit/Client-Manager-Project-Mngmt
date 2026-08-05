"use client";

import { CrmProductTour } from "@/app/components/domain/crm-product-tour";
import { CrmTourProvider } from "@/app/components/domain/crm-tour-context";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

/**
 * @param {{ viewer: object, organizationName: string, children: React.ReactNode }} props
 */
export function DashboardAppShell({ viewer, organizationName, children }) {
  return (
    <CrmTourProvider scope="INTERNAL" role={viewer.role}>
      <SidebarProvider>
        <DashboardSidebar viewer={viewer} organizationName={organizationName} />
        <SidebarInset className="min-w-0">
          <DashboardTopbar />
          <main id="main" data-tour="main-content" className="page-shell min-w-0 flex-1 py-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <CrmProductTour />
    </CrmTourProvider>
  );
}
