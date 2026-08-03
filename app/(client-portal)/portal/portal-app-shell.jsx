"use client";

import { UserMenu } from "@/app/components/domain/user-menu";
import { CrmProductTour } from "@/app/components/domain/crm-product-tour";
import { CrmTourProvider } from "@/app/components/domain/crm-tour-context";
import { CrmTourTrigger } from "@/app/components/domain/crm-tour-trigger";

import { PortalNavBar, PortalTabBar } from "./portal-nav";

/**
 * @param {{
 *   viewer: object;
 *   companyName: string;
 *   badges: { approvals?: number };
 *   children: React.ReactNode;
 * }} props
 */
export function PortalAppShell({ viewer, companyName, badges, children }) {
  return (
    <CrmTourProvider scope="PORTAL" role="contact">
      <div data-surface="app" className="flex min-h-svh flex-1 flex-col bg-background">
        <header className="border-b bg-card/70 backdrop-blur">
          <div className="page-shell flex h-16 items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 font-semibold text-primary"
              >
                {companyName.charAt(0)}
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-semibold tracking-tight">{companyName}</span>
                <span className="truncate text-[0.6875rem] text-muted-foreground">
                  Client portal · delivered by Meridian
                </span>
              </span>
            </div>

            <div className="mx-auto hidden md:block">
              <PortalNavBar badges={badges} />
            </div>

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <CrmTourTrigger />
              <span data-tour="portal-account">
                <UserMenu
                  compact
                  scope="PORTAL"
                  name={viewer.name}
                  email={viewer.email}
                  secondary={viewer.roleLabel}
                  avatarUrl={viewer.avatarUrl}
                />
              </span>
            </div>
          </div>
        </header>

        <main id="main" className="page-shell w-full flex-1 pt-8 pb-24 md:pb-14">
          {children}
        </main>

        <PortalTabBar badges={badges} />
      </div>
      <CrmProductTour />
    </CrmTourProvider>
  );
}
