import { pickList } from "@/app/lib/api/safe-list";
import {
  buildApprovalQueue,
  countAwaitingViewer,
} from "@/app/lib/approvals";
import {
  normalizePortalProjects,
  portalContactName,
} from "@/app/lib/api/portal";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalApprovalsInboxDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";
import { mktFontClassName } from "@/app/lib/marketing/fonts";
import { privateAppMetadata } from "@/app/lib/marketing/seo";

import { PortalAppShell } from "./portal-app-shell";

export const metadata = {
  ...privateAppMetadata,
  title: { default: "Client portal", template: "%s · Client portal" },
};

export default async function ClientPortalLayout({ children }) {
  const viewer = await requireViewer("PORTAL");
  const companyName = viewer.company?.name ?? "Your projects";

  let awaitingCount = 0;
  try {
    const { data } = await getClient().query({ query: PortalApprovalsInboxDocument });
    const projects = normalizePortalProjects(pickList(data, "portalProjects"));
    const viewerName = portalContactName(data.me?.contact);
    awaitingCount = countAwaitingViewer(buildApprovalQueue(projects, viewerName));
  } catch {
    awaitingCount = 0;
  }

  const badges = { approvals: awaitingCount };

  return (
    <div className={mktFontClassName}>
      <PortalAppShell viewer={viewer} companyName={companyName} badges={badges}>
        {children}
      </PortalAppShell>
    </div>
  );
}
