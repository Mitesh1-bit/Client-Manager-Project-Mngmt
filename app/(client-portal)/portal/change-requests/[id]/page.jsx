import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ChangeRequestDecisionPanel } from "@/app/components/domain/change-request-decision-panel";
import { ChangeRequestStatusPanel } from "@/app/components/domain/change-request-status-panel";
import { isOpen } from "@/app/lib/change-requests";
import { normalizePortalChangeRequest } from "@/app/lib/api/portal";
import { humanizeType } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalChangeRequestDetailDocument } from "@/app/lib/graphql/generated/documents";

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
      <Link
        href="/portal/change-requests"
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Your requests
      </Link>

      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="tabular text-caption text-muted-foreground">
            {request.reference} · {humanizeType(request.type)}
          </p>
          <h1 className="mt-0.5 text-title text-balance">{request.title}</h1>
          <p className="mt-1 text-caption text-muted-foreground">{project?.name ?? "Project"}</p>
        </div>
        {isOpen(request.status) ? (
          <WithdrawButton requestId={request.id} reference={request.reference} />
        ) : null}
      </header>

      <div className="space-y-5">
        <ChangeRequestStatusPanel request={request} audience="CLIENT" />

        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="text-subheading">What you asked for</h2>
          <p className="mt-2 text-caption text-pretty">{request.description}</p>
        </section>

        {request.assessmentNotes ? (
          <section className="rounded-2xl border bg-card p-4 sm:p-5">
            <h2 className="text-subheading">What this involves</h2>
            <p className="mt-2 text-caption text-pretty">{request.assessmentNotes}</p>
          </section>
        ) : null}

        <ChangeRequestDecisionPanel request={request} approverType="CLIENT" />
      </div>
    </div>
  );
}
