import Link from "next/link";
import { CircleCheck, Inbox } from "lucide-react";

import {
  AwaitingYouBanner,
  MilestoneApprovalPanel,
} from "@/app/components/domain/milestone-approval-panel";
import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { APPROVAL_STATE, buildApprovalQueue, countAwaitingViewer } from "@/app/lib/approvals";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalApprovalsDocument } from "@/app/lib/graphql/generated/documents";

export const metadata = { title: "Approvals" };

export default async function PortalApprovalsPage() {
  const { data } = await getClient().query({ query: PortalApprovalsDocument });

  const viewerName = data.me?.contact?.fullName ?? null;
  const queue = buildApprovalQueue(data.projects.nodes, viewerName);
  const awaiting = countAwaitingViewer(queue);

  const open = queue.filter(
    (item) =>
      item.approvalState.state !== APPROVAL_STATE.APPROVED &&
      item.approvalState.state !== APPROVAL_STATE.CHANGES_REQUESTED,
  );
  const settled = queue.filter(
    (item) =>
      item.approvalState.state === APPROVAL_STATE.APPROVED ||
      item.approvalState.state === APPROVAL_STATE.CHANGES_REQUESTED,
  );

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Everything we've sent over for sign-off, and where each one has got to."
      />

      {queue.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing to approve"
          description="When we finish a milestone that needs your sign-off, it'll appear here and we'll email you."
          action={
            <Button variant="outline" asChild>
              <Link href="/portal/projects">See your projects</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <AwaitingYouBanner count={awaiting} />

          {open.length > 0 ? (
            <section aria-labelledby="open-approvals" className="space-y-4">
              <h2 id="open-approvals" className="text-subheading">
                Open
              </h2>
              {open.map((item) => (
                <MilestoneApprovalPanel
                  key={item.key}
                  milestone={item.milestone}
                  viewerName={viewerName}
                  projectName={item.project.name}
                />
              ))}
            </section>
          ) : (
            <section className="flex items-start gap-3 rounded-2xl border border-tone-positive-border bg-tone-positive-bg p-4 text-tone-positive-fg">
              <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-medium">You&apos;re all caught up</p>
                <p className="mt-0.5 text-caption">
                  Nothing is waiting on you or your team right now.
                </p>
              </div>
            </section>
          )}

          {settled.length > 0 ? (
            <section aria-labelledby="settled-approvals" className="space-y-4">
              <h2 id="settled-approvals" className="text-subheading">
                Already decided
              </h2>
              {settled.map((item) => (
                <MilestoneApprovalPanel
                  key={item.key}
                  milestone={item.milestone}
                  viewerName={viewerName}
                  projectName={item.project.name}
                />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
