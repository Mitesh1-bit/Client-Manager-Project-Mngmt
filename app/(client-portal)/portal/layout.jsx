import { UserMenu } from "@/app/components/domain/user-menu";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalApprovalsDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";
import { mktFontClassName } from "@/app/lib/marketing/fonts";
import { privateAppMetadata } from "@/app/lib/marketing/seo";

import { PortalNavBar, PortalTabBar } from "./portal-nav";

export const metadata = {
  ...privateAppMetadata,
  title: { default: "Client portal", template: "%s · Client portal" },
};

export default async function ClientPortalLayout({ children }) {
  const viewer = await requireViewer("PORTAL");
  const companyName = viewer.company?.name ?? "Your projects";

  // The "something needs you" count sits in the chrome, so it's visible from
  // every screen rather than only the one that lists approvals.
  let awaitingCount = 0;
  try {
    const { data } = await getClient().query({ query: PortalApprovalsDocument });
    awaitingCount = (data.portalPendingApprovals ?? []).length;
  } catch {
    awaitingCount = 0;
  }

  const badges = { approvals: awaitingCount };

  return (
    <div
      data-surface="app"
      className={`${mktFontClassName} flex min-h-svh flex-1 flex-col bg-background`}
    >
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

          <div className="ml-auto md:ml-0">
            <UserMenu
              compact
              scope="PORTAL"
              name={viewer.name}
              email={viewer.email}
              secondary={viewer.roleLabel}
              avatarUrl={viewer.avatarUrl}
            />
          </div>
        </div>
      </header>

      <main id="main" className="page-shell w-full flex-1 pt-8 pb-24 md:pb-14">
        {children}
      </main>

      <PortalTabBar badges={badges} />
    </div>
  );
}
