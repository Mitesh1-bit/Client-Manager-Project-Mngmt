import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Download, FileText } from "lucide-react";

import { ChangeRequestDecisionPanel } from "@/app/components/domain/change-request-decision-panel";
import { ChangeRequestStatusPanel } from "@/app/components/domain/change-request-status-panel";
import { CommentThread } from "@/app/components/domain/comment-thread";
import { isOpen } from "@/app/lib/change-requests";
import { formatBytes, formatDate, humanizeType } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { ChangeRequestDetailDocument } from "@/app/lib/graphql/generated/documents";

import { WithdrawButton } from "./withdraw-button";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: ChangeRequestDetailDocument, variables: { id } });
  return { title: data.changeRequest?.reference ?? "Request" };
}

export default async function PortalChangeRequestDetailPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: ChangeRequestDetailDocument, variables: { id } });

  // The API scopes `changeRequest` to the caller's own company, so another
  // client's request resolves to null and lands on the not-found screen.
  const request = data.changeRequest;
  if (!request) notFound();

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
          <p className="mt-1 text-caption text-muted-foreground">{request.project.name}</p>
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

        {request.attachments.length > 0 ? (
          <section className="rounded-2xl border bg-card p-4 sm:p-5">
            <h2 className="text-subheading">Attachments</h2>
            <ul className="mt-3 space-y-1.5">
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
          </section>
        ) : null}

        <CommentThread
          entityType="CHANGE_REQUEST"
          entityId={request.id}
          comments={request.comments}
          audience="CLIENT"
        />
      </div>
    </div>
  );
}
