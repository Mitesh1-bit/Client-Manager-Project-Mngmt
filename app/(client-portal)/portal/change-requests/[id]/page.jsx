import { notFound } from "next/navigation";

import { ChangeRequestDecisionPanel } from "@/app/components/domain/change-request-decision-panel";
import { ChangeRequestStatusPanel } from "@/app/components/domain/change-request-status-panel";
import { isOpen } from "@/app/lib/change-requests";
import { normalizePortalChangeRequest } from "@/app/lib/api/portal";
import { humanizeType } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalChangeRequestDetailDocument } from "@/app/lib/graphql/generated/documents";

import {
  PortalBackLink,
  PortalCard,
  PortalPageHeader,
  PortalSectionHeader,
} from "../../portal-ui";
import { WithdrawButton } from "./withdraw-button";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: PortalChangeRequestDetailDocument,
    variables: { id },
  });
  const request = normalizePortalChangeRequest(data.portalChangeRequest);
  return { title: request?.reference ?? "Request" };
}

export default async function PortalChangeRequestDetailPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: PortalChangeRequestDetailDocument,
    variables: { id },
  });

  const request = normalizePortalChangeRequest(data.portalChangeRequest);
  if (!request) notFound();

  const projectsById = new Map((data.portalProjects ?? []).map((p) => [p.id, p]));
  const project = projectsById.get(request.projectId) ?? request.project;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PortalBackLink href="/portal/change-requests">Your change requests</PortalBackLink>

      <PortalPageHeader
        eyebrow={`${request.reference} · ${humanizeType(request.type)}`}
        title={request.title}
        description={project?.name ?? "Project"}
        actions={
          isOpen(request.status) || request.status === "REJECTED" ? (
            <WithdrawButton
              requestId={request.id}
              reference={request.reference}
              status={request.status}
            />
          ) : null
        }
      />

      <div className="space-y-5">
        <ChangeRequestStatusPanel request={request} audience="CLIENT" />

        <PortalCard>
          <PortalSectionHeader title="What you asked for" />
          <p className="text-sm leading-relaxed text-pretty">{request.description}</p>
        </PortalCard>

        {request.assessmentNotes ? (
          <PortalCard>
            <PortalSectionHeader title="What this involves" />
            <p className="text-sm leading-relaxed text-pretty">{request.assessmentNotes}</p>
          </PortalCard>
        ) : null}

        <ChangeRequestDecisionPanel request={request} approverType="CLIENT" />
      </div>
    </div>
  );
}
