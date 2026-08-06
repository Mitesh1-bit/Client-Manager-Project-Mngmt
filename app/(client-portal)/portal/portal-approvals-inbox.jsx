"use client";

import Link from "next/link";
import { Inbox, ShieldCheck } from "lucide-react";

import { MilestoneApprovalPanel } from "@/app/components/domain/milestone-approval-panel";
import { Button } from "@/app/components/ui/button";
import { APPROVAL_STATE, buildApprovalQueue, countAwaitingViewer } from "@/app/lib/approvals";

import {
  PortalActionBanner,
  PortalEmptyPanel,
  PortalSectionHeader,
} from "./portal-ui";

/**
 * Cross-project approval inbox — actionable items first, then the rest.
 *
 * @param {{ projects: Array<object>, viewerName: string | null }} props
 */
export function PortalApprovalsInbox({ projects, viewerName }) {
  const queue = buildApprovalQueue(projects, viewerName);
  const awaitingYou = queue.filter((item) => item.approvalState.actionable);
  const other = queue.filter((item) => !item.approvalState.actionable);
  const awaitingCount = countAwaitingViewer(queue);

  if (queue.length === 0) {
    return (
      <PortalEmptyPanel>
        <Inbox aria-hidden="true" className="mx-auto size-10 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold text-[#0a1550]">Nothing waiting on you</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          When we mark a milestone ready for your review, it will show up here with approve and
          request-changes actions.
        </p>
        <Button variant="outline" className="mt-5" asChild>
          <Link href="/portal/projects">Browse your projects</Link>
        </Button>
      </PortalEmptyPanel>
    );
  }

  return (
    <div className="space-y-8">
      {awaitingCount > 0 ? (
        <section aria-labelledby="portal-approvals-action" className="space-y-5">
          <PortalActionBanner
            icon={ShieldCheck}
            title={
              awaitingCount === 1
                ? "1 milestone needs your decision"
                : `${awaitingCount} milestones need your decision`
            }
            description="Review each item below, then approve or request changes so work can continue."
          />

          <ul className="space-y-5">
            {awaitingYou.map((item) => (
              <li key={item.key} id={`milestone-${item.milestone.id}`}>
                <MilestoneApprovalPanel
                  milestone={item.milestone}
                  viewerName={viewerName}
                  projectName={item.project.name}
                />
                <p className="mt-2.5 text-center text-xs text-muted-foreground">
                  <Link
                    href={`/portal/projects/${item.project.id}#milestone-${item.milestone.id}`}
                    className="font-semibold text-[#1e3a8a] hover:underline focus-ring"
                  >
                    View full project context
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {other.length > 0 ? (
        <section aria-labelledby="portal-approvals-other">
          <PortalSectionHeader
            id="portal-approvals-other"
            title={awaitingCount > 0 ? "Other milestones" : "All milestones"}
            description="Waiting on your team or already signed off — no action needed from you right now."
          />

          <ul className="space-y-2">
            {other.map((item) => {
              const waitingOnYou = item.approvalState.state === APPROVAL_STATE.WAITING_OTHER;
              return (
                <li key={item.key}>
                  <Link
                    href={`/portal/projects/${item.project.id}#milestone-${item.milestone.id}`}
                    className="portal-link-row group"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-muted-foreground">
                        {item.project.name}
                      </span>
                      <span className="mt-0.5 block font-semibold text-pretty group-hover:text-[#1e3a8a]">
                        {item.milestone.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {item.approvalState.label}
                        {waitingOnYou && item.approvalState.waitingOn
                          ? ` · waiting on ${item.approvalState.waitingOn}`
                          : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
