import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Download, FileText, XCircle } from "lucide-react";

import { ChangeRequestDecisionPanel } from "@/app/components/domain/change-request-decision-panel";
import { ChangeRequestStatusPanel } from "@/app/components/domain/change-request-status-panel";
import { ChangeRequestTimeline } from "@/app/components/domain/change-request-timeline";
import { CommentThread } from "@/app/components/domain/comment-thread";
import { SectionCard } from "@/app/components/domain/states";
import { formatBytes, formatDate, humanizeType } from "@/app/lib/format";
import { pickList } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ChangeRequestDetailDocument,
  ChangeRequestFormOptionsDocument,
} from "@/app/lib/graphql/generated/documents";

import { AssessmentPanel } from "./assessment-panel";
import { ChangeRequestActions } from "./change-request-actions";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: ChangeRequestDetailDocument, variables: { id } });
  return { title: data.changeRequest ? `${data.changeRequest.reference} · ${data.changeRequest.title}` : "Change request" };
}

export default async function ChangeRequestDetailPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: ChangeRequestDetailDocument, variables: { id } }),
    getClient().query({ query: ChangeRequestFormOptionsDocument }),
  ]);

  const request = data.changeRequest;
  if (!request) notFound();

  const threshold = data.me?.organization?.settings?.changeRequestInternalApprovalThresholdCost ?? 0;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/change-requests"
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Change requests
      </Link>

      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="tabular text-caption text-muted-foreground">{request.reference}</p>
          <h1 className="mt-0.5 text-title text-balance">{request.title}</h1>
          <p className="mt-1.5 text-caption text-muted-foreground">
            <Link
              href={`/companies/${request.company.id}`}
              className="rounded-sm hover:text-foreground hover:underline focus-ring"
            >
              {request.company.name}
            </Link>
            {" · "}
            <Link
              href={`/projects/${request.project.id}/board`}
              className="rounded-sm hover:text-foreground hover:underline focus-ring"
            >
              {request.project.name}
            </Link>
            {" · "}
            {humanizeType(request.type)}
            {request.requestedByContact ? ` · raised by ${request.requestedByContact.fullName}` : ""}
          </p>
        </div>

        {request.status !== "CLOSED" ? (
          <ChangeRequestActions request={request} users={pickList(options, "users")} />
        ) : null}
      </header>

      {request.status === "CLOSED" && request.decisionReason?.startsWith("Withdrawn") ? (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border bg-muted/50 px-4 py-3 text-caption text-muted-foreground">
          <XCircle aria-hidden="true" className="size-4 shrink-0" />
          Withdrawn by the client{request.decisionReason ? `: ${request.decisionReason}` : ""}
        </div>
      ) : null}

      <div className="space-y-5">
        <ChangeRequestStatusPanel request={request} audience="INTERNAL" />

        {request.description ? (
          <SectionCard title="What was asked for">
            <p className="text-caption text-pretty">{request.description}</p>
          </SectionCard>
        ) : null}

        <AssessmentPanel request={request} threshold={threshold} />

        {/* Renders the decide-now form when internal sign-off is outstanding,
            otherwise falls back to decision history if there is any. */}
        <ChangeRequestDecisionPanel request={request} approverType="INTERNAL" />

        {request.attachments.length > 0 ? (
          <SectionCard title="Attachments">
            <ul className="space-y-1.5">
              {request.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a
                    href={attachment.fileUrl}
                    download
                    className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent focus-ring"
                  >
                    <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-caption font-medium">
                        {attachment.name}
                      </span>
                      <span className="block text-[0.75rem] text-muted-foreground">
                        {formatBytes(attachment.sizeBytes)} · {formatDate(attachment.createdAt)}
                      </span>
                    </span>
                    <Download aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        <SectionCard title="History">
          <ChangeRequestTimeline request={request} />
        </SectionCard>

        <CommentThread
          entityType="CHANGE_REQUEST"
          entityId={request.id}
          comments={request.comments}
          audience="INTERNAL"
        />
      </div>
    </div>
  );
}
