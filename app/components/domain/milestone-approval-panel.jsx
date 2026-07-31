"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import {
  CircleCheck,
  CircleDashed,
  Clock,
  Download,
  FileText,
  LoaderCircle,
  MessageSquareWarning,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { APPROVAL_STATE, approvalNextAction, getMilestoneApprovalState } from "@/app/lib/approvals";
import { formatBytes, formatDate, formatDateTime, initials } from "@/app/lib/format";
import { ApproveMilestoneDocument, RequestMilestoneChangesDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

const STATE_STYLES = {
  [APPROVAL_STATE.YOUR_TURN]: {
    icon: ShieldCheck,
    frame: "border-tone-caution-border bg-tone-caution-bg",
    chip: "bg-tone-caution text-white",
  },
  [APPROVAL_STATE.WAITING_OTHER]: {
    icon: Clock,
    frame: "border-tone-info-border bg-tone-info-bg",
    chip: "bg-tone-info text-white",
  },
  [APPROVAL_STATE.WAITING_INTERNAL]: {
    icon: CircleDashed,
    frame: "border-tone-info-border bg-tone-info-bg",
    chip: "bg-tone-info text-white",
  },
  [APPROVAL_STATE.APPROVED]: {
    icon: CircleCheck,
    frame: "border-tone-positive-border bg-tone-positive-bg",
    chip: "bg-tone-positive text-white",
  },
  [APPROVAL_STATE.CHANGES_REQUESTED]: {
    icon: MessageSquareWarning,
    frame: "border-tone-critical-border bg-tone-critical-bg",
    chip: "bg-tone-critical text-white",
  },
  [APPROVAL_STATE.NOT_READY]: {
    icon: CircleDashed,
    frame: "border-border bg-muted/50",
    chip: "bg-muted-foreground text-background",
  },
  [APPROVAL_STATE.NOT_REQUIRED]: {
    icon: CircleDashed,
    frame: "border-border bg-muted/50",
    chip: "bg-muted-foreground text-background",
  },
};

/**
 * Milestone sign-off, from the client's side.
 *
 * Every variant leads with the same three things in the same order: what state
 * this is in, who it is waiting on, and the one action available. The decision
 * is optimistic — the panel switches to its resolved state immediately and
 * rolls back with a toast if the write fails.
 *
 * @param {{ milestone: object, viewerName?: string | null, projectName?: string, compact?: boolean }} props
 */
export function MilestoneApprovalPanel({ milestone, viewerName, projectName, compact = false }) {
  const router = useRouter();
  const [approveMilestone] = useMutation(ApproveMilestoneDocument);
  const [requestChanges] = useMutation(RequestMilestoneChangesDocument);

  const [pendingOutcome, setPendingOutcome] = useState(null);
  const [mode, setMode] = useState(null); // null | 'approve' | 'reject'
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState(null);

  // Clear the optimistic outcome once the refreshed server value lands.
  const [serverMilestone, setServerMilestone] = useState(milestone);
  if (serverMilestone !== milestone) {
    setServerMilestone(milestone);
    setPendingOutcome(null);
    setMode(null);
    setComment("");
  }

  const resolved = getMilestoneApprovalState(milestone, viewerName);
  const approvalState = pendingOutcome
    ? {
        ...resolved,
        state:
          pendingOutcome === "APPROVED"
            ? APPROVAL_STATE.APPROVED
            : APPROVAL_STATE.CHANGES_REQUESTED,
        actionable: false,
        label: pendingOutcome === "APPROVED" ? "Approved" : "Changes requested",
      }
    : resolved;

  const style = STATE_STYLES[approvalState.state] ?? STATE_STYLES[APPROVAL_STATE.NOT_READY];
  const Icon = style.icon;

  async function decide(outcome) {
    if (outcome === "REJECTED" && !comment.trim()) {
      setCommentError("Tell us what needs to change so we can act on it.");
      return;
    }

    setCommentError(null);
    setPendingOutcome(outcome);

    const approvalId =
      resolved.yourApproval?.id ??
      milestone.approvals?.find(
        (a) => a.approverType === "CLIENT" && a.status === "PENDING",
      )?.id;

    if (!approvalId) {
      toast.error("No pending approval found for this milestone.");
      setPendingOutcome(null);
      return;
    }

    try {
      if (outcome === "APPROVED") {
        await approveMilestone({ variables: { approvalId } });
      } else {
        await requestChanges({ variables: { approvalId, comment: comment.trim() } });
      }
      toast.success(
        outcome === "APPROVED"
          ? `“${milestone.title}” approved`
          : `Changes requested on “${milestone.title}”`,
        { description: "The delivery team has been notified." },
      );
      router.refresh();
    } catch (error) {
      setPendingOutcome(null);
      toast.error("We couldn't record that", {
        description: error?.message ?? "Nothing was changed. Please try again.",
      });
    }
  }

  return (
    <section
      aria-labelledby={`approval-${milestone.id}`}
      className={cn("rounded-2xl border p-4 sm:p-5", style.frame)}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            style.chip,
          )}
        >
          <Icon aria-hidden="true" className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-caption font-semibold tracking-wide uppercase opacity-80">
            {approvalState.label}
          </p>
          <h3 id={`approval-${milestone.id}`} className="mt-0.5 text-subheading text-pretty">
            {milestone.title}
          </h3>
          <p className="mt-1 text-caption text-pretty">
            {approvalNextAction(approvalState, { milestoneTitle: milestone.title })}
          </p>

          <dl className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] opacity-80">
            {projectName ? (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Project</dt>
                <dd>{projectName}</dd>
              </div>
            ) : null}
            {milestone.dueDate ? (
              <div className="flex items-center gap-1.5">
                <dt>Due</dt>
                <dd>
                  <time dateTime={milestone.dueDate}>{formatDate(milestone.dueDate)}</time>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      {milestone.description && !compact ? (
        <p className="mt-4 text-caption text-pretty opacity-90">{milestone.description}</p>
      ) : null}

      {!compact && milestone.documents?.length ? (
        <Deliverables documents={milestone.documents} />
      ) : null}

      {approvalState.actionable ? (
        <div className="mt-4 border-t border-current/10 pt-4">
          {mode === "reject" ? (
            <div className="space-y-2.5">
              <Label htmlFor={`comment-${milestone.id}`} className="text-caption font-medium">
                What needs to change?
              </Label>
              <Textarea
                id={`comment-${milestone.id}`}
                value={comment}
                onChange={(event) => {
                  setComment(event.target.value);
                  if (commentError) setCommentError(null);
                }}
                rows={3}
                autoFocus
                aria-invalid={Boolean(commentError)}
                aria-describedby={commentError ? `comment-error-${milestone.id}` : undefined}
                placeholder="The booking confirmation wording needs to match our clinical tone of voice…"
                className="bg-background"
              />
              {commentError ? (
                <p
                  id={`comment-error-${milestone.id}`}
                  className="text-caption font-medium text-destructive"
                >
                  {commentError}
                </p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button
                  variant="destructive"
                  disabled={Boolean(pendingOutcome)}
                  onClick={() => decide("REJECTED")}
                >
                  {pendingOutcome ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  ) : null}
                  Send these changes
                </Button>
                <Button variant="ghost" onClick={() => setMode(null)}>
                  Back
                </Button>
              </div>
            </div>
          ) : mode === "approve" ? (
            <div className="space-y-2.5">
              <Label htmlFor={`note-${milestone.id}`} className="text-caption font-medium">
                Anything to add? <span className="font-normal opacity-70">(optional)</span>
              </Label>
              <Textarea
                id={`note-${milestone.id}`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={2}
                autoFocus
                placeholder="Happy with this — good to go."
                className="bg-background"
              />
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button disabled={Boolean(pendingOutcome)} onClick={() => decide("APPROVED")}>
                  {pendingOutcome ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  ) : (
                    <CircleCheck aria-hidden="true" />
                  )}
                  Confirm approval
                </Button>
                <Button variant="ghost" onClick={() => setMode(null)}>
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button size="lg" className="sm:w-auto" onClick={() => setMode("approve")}>
                <CircleCheck aria-hidden="true" />
                Approve
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-background sm:w-auto"
                onClick={() => setMode("reject")}
              >
                <MessageSquareWarning aria-hidden="true" />
                Request changes
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {approvalState.decided.length > 0 && !compact ? (
        <DecisionHistory decisions={approvalState.decided} />
      ) : null}
    </section>
  );
}

function Deliverables({ documents }) {
  return (
    <div className="mt-4">
      <h4 className="text-caption font-medium">What you&apos;re reviewing</h4>
      <ul className="mt-2 space-y-1.5">
        {documents.map((document) => (
          <li key={document.id}>
            <a
              href={document.fileUrl}
              download
              className="flex items-center gap-2.5 rounded-lg border bg-background/70 px-3 py-2.5 transition-colors hover:bg-background focus-ring"
            >
              <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-caption font-medium">{document.name}</span>
                <span className="block text-[0.75rem] text-muted-foreground">
                  v{document.version} · {formatBytes(document.sizeBytes)} ·{" "}
                  {document.uploadedByName}
                </span>
              </span>
              <Download aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="sr-only">Download {document.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DecisionHistory({ decisions }) {
  return (
    <div className="mt-4 border-t border-current/10 pt-4">
      <h4 className="text-caption font-medium">History</h4>
      <ol className="mt-2 space-y-2.5">
        {decisions.map((decision) => (
          <li key={decision.id} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-background/70 text-[0.5625rem] font-medium"
            >
              {initials(decision.approverName ?? "?")}
            </span>
            <div className="min-w-0 text-[0.75rem]">
              <p>
                <span className="font-medium">{decision.approverName ?? "Someone"}</span>{" "}
                {decision.status === "APPROVED" ? "approved" : "requested changes"}
                {decision.approverType === "INTERNAL" ? " (internal review)" : ""} ·{" "}
                <time dateTime={decision.decidedAt}>{formatDateTime(decision.decidedAt)}</time>
              </p>
              {decision.comment ? (
                <p className="mt-0.5 text-pretty opacity-80">“{decision.comment}”</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The banner shown above a list when something in it needs the client. Keeps
 * the "there is something for you" signal in one place.
 */
export function AwaitingYouBanner({ count }) {
  if (count === 0) return null;

  return (
    <Alert className="border-tone-caution-border bg-tone-caution-bg text-tone-caution-fg">
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>
        {count === 1 ? "One thing needs your approval" : `${count} things need your approval`}
      </AlertTitle>
      <AlertDescription className="text-tone-caution-fg/90">
        Work can&apos;t move forward until you review {count === 1 ? "it" : "them"}.
      </AlertDescription>
    </Alert>
  );
}
