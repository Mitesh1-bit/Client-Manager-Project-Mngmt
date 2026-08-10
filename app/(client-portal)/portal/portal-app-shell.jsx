"use client";

import Link from "next/link";

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
    // eslint-disable-next-line jsx-a11y/aria-role -- `role` is CrmTourProvider's viewer-role prop, not a DOM ARIA role
    <CrmTourProvider scope="PORTAL" role="contact">
      <div data-surface="portal" className="flex min-h-svh flex-1 flex-col">
        <header className="portal-shell-header">
          <div className="page-shell flex h-[4.25rem] items-center gap-4 sm:h-[4.5rem]">
            <div className="portal-company-badge min-w-0 flex-1 md:flex-none">
              <span className="portal-brand-mark shrink-0" aria-hidden="true">
                {companyName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold tracking-tight text-[#0a1550]">
                  {companyName}
                </span>
                <span className="block truncate text-[0.6875rem] text-muted-foreground">
                  Powered by{" "}
                  <Link href="/" className="font-medium text-[#1e3a8a] hover:underline">
                    Meridian
                  </Link>
                </span>
              </span>
            </div>

            <div className="mx-auto hidden lg:block">
              <PortalNavBar badges={badges} />
            </div>

            <div className="ml-auto flex items-center gap-1">
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

        <main
          id="main"
          data-tour="main-content"
          className="page-shell min-w-0 w-full flex-1 py-6 pb-28 md:py-8 md:pb-16 lg:pb-10"
        >
          {children}
        </main>

        <PortalTabBar badges={badges} />
      </div>
      <CrmProductTour />
    </CrmTourProvider>
  );
}
