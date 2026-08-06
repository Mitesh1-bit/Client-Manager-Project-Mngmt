import { ErrorState } from "@/app/components/domain/states";
import {
  normalizePortalProjects,
  portalContactName,
} from "@/app/lib/api/portal";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalApprovalsInboxDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { PortalApprovalsInbox } from "../portal-approvals-inbox";
import { PortalPageHeader } from "../portal-ui";

export const metadata = { title: "Approvals" };

export default async function PortalApprovalsPage() {
  await requireViewer("PORTAL");

  let projects = [];
  let viewerName = null;
  let loadError = null;

  try {
    const { data } = await getClient().query({ query: PortalApprovalsInboxDocument });
    projects = normalizePortalProjects(data.portalProjects);
    viewerName = portalContactName(data.me?.contact);
  } catch (error) {
    loadError = error;
    console.error("[portal approvals] failed", error);
  }

  return (
    <>
      <PortalPageHeader
        eyebrow="Action needed"
        title="Approvals"
        description="Review milestones and sign off when deliverables are ready — or request changes if something needs adjusting."
      />

      {loadError ? (
        <ErrorState
          title="We couldn't load approvals"
          description={loadError?.message ?? "Try refreshing the page."}
        />
      ) : (
        <PortalApprovalsInbox projects={projects} viewerName={viewerName} />
      )}
    </>
  );
}
