"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { CircleCheck, LoaderCircle, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { canDecide } from "@/app/lib/change-requests";
import { formatDateTime, initials } from "@/app/lib/format";
import { DecideChangeRequestDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

/**
 * Records one approver's decision, built around `ChangeRequestDecision`
 * (outcome / approverType / comment) rather than a bare enum — a rejection has
 * to carry a reason, and the same panel serves both the internal and client
 * routes with only the wording changing (driven by `approverType` itself,
 * since the two never diverge in practice: an internal caller always decides
 * as INTERNAL, a portal caller always as CLIENT).
 *
 * @param {{ request: object, approverType: 'INTERNAL' | 'CLIENT' }} props
 */
export function ChangeRequestDecisionPanel({ request, approverType }) {
  const router = useRouter();
  const [decide] = useMutation(DecideChangeRequestDocument);

  const [mode, setMode] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);

  const allowed = canDecide(request, approverType);
  const client = approverType === "CLIENT";

  const decided = (request.approvals ?? []).filter((approval) => approval.status !== "PENDING");
  const mine = (request.approvals ?? []).find(
    (approval) => approval.approverType === approverType && approval.status === "PENDING",
  );

  async function submit(outcome) {
    if (outcome === "REJECTED" && !comment.trim()) {
      setError(
        client
          ? "Let us know why, so we can come back with something that works."
          : "Give a reason — the client sees this.",
      );
      return;
    }

    setError(null);
    setPending(outcome);
    try {
      await decide({
        variables: {
          id: request.id,
          decision: { outcome, approverType, comment: comment.trim() || null },
        },
      });
      toast.success(
        outcome === "APPROVED"
          ? `${request.reference} approved`
          : `${request.reference} rejected`,
        {
          description:
            outcome === "APPROVED" && client
              ? "We'll schedule the work and keep you posted."
              : outcome === "APPROVED"
                ? "It moves on to the next approver."
                : "Everyone involved has been notified.",
        },
      );
      router.refresh();
    } catch (mutationError) {
      setPending(null);
      toast.error("We couldn't record that", {
        description: mutationError?.message ?? "Nothing was changed. Try again.",
      });
    }
  }

  if (!allowed) {
    return decided.length > 0 ? <DecisionHistory decisions={decided} /> : null;
  }

  return (
    <>
      <section
        aria-labelledby={`decision-${request.id}`}
        className="rounded-2xl border border-tone-caution-border bg-tone-caution-bg p-4 sm:p-5"
      >
        <h2 id={`decision-${request.id}`} className="text-subheading">
          {client ? "Your decision" : "Internal sign-off"}
        </h2>
        <p className="mt-1 text-caption text-pretty">
          {client
            ? "Approving means we schedule this and the impact above is applied to your plan."
            : `Sign off as ${mine?.approverName ?? "the delivery lead"} before this goes to the client.`}
        </p>

        <div className="mt-4">
          <Label htmlFor={`decision-comment-${request.id}`} className="text-caption font-medium">
            {mode === "REJECTED" ? (
              client ? (
                "Why not?"
              ) : (
                "Reason for rejecting"
              )
            ) : (
              <>
                Anything to add? <span className="font-normal opacity-70">(optional)</span>
              </>
            )}
          </Label>
          <Textarea
            id={`decision-comment-${request.id}`}
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              if (error) setError(null);
            }}
            rows={3}
            className="mt-1.5 bg-background"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `decision-error-${request.id}` : undefined}
            placeholder={
              mode === "REJECTED"
                ? "The timeline impact doesn't work for us this quarter…"
                : "Happy with the cost and the timeline."
            }
          />
          {error ? (
            <p
              id={`decision-error-${request.id}`}
              className="mt-1.5 text-caption font-medium text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            size="lg"
            disabled={Boolean(pending)}
            onClick={() => {
              setMode("APPROVED");
              submit("APPROVED");
            }}
          >
            {pending === "APPROVED" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <CircleCheck aria-hidden="true" />
            )}
            {client ? "Approve this change" : "Approve"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-background"
            disabled={Boolean(pending)}
            onClick={() => {
              if (mode !== "REJECTED") {
                setMode("REJECTED");
                return;
              }
              submit("REJECTED");
            }}
          >
            {pending === "REJECTED" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <ThumbsDown aria-hidden="true" />
            )}
            {mode === "REJECTED" ? "Confirm rejection" : client ? "Decline" : "Reject"}
          </Button>
        </div>
      </section>

      {decided.length > 0 ? <DecisionHistory decisions={decided} /> : null}
    </>
  );
}

export function DecisionHistory({ decisions }) {
  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <h2 className="text-subheading">Decisions</h2>
      <ol className="mt-3 space-y-3">
        {decisions.map((decision) => (
          <li key={decision.id} className="flex gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-medium",
                decision.status === "APPROVED"
                  ? "bg-tone-positive-bg text-tone-positive-fg"
                  : "bg-tone-critical-bg text-tone-critical-fg",
              )}
            >
              {initials(decision.approverName ?? "?")}
            </span>
            <div className="min-w-0 text-caption">
              <p>
                <span className="font-medium">{decision.approverName ?? "Someone"}</span>{" "}
                {decision.status === "APPROVED" ? "approved" : "rejected"}
                {decision.approverType === "INTERNAL" ? " (internal)" : " (client)"}
                {decision.decidedAt ? (
                  <>
                    {" · "}
                    <time dateTime={decision.decidedAt}>{formatDateTime(decision.decidedAt)}</time>
                  </>
                ) : null}
              </p>
              {decision.comment ? (
                <p className="mt-0.5 text-pretty text-muted-foreground">“{decision.comment}”</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
