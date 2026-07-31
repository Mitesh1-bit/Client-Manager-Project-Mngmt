import { Building2, CircleCheck, CircleDashed, Clock, PauseCircle, TriangleAlert } from "lucide-react";

import { StatusBadge } from "@/app/components/domain/status-badge";
import { formatCurrency, formatDate, formatRelativeDays } from "@/app/lib/format";
import { isAssessed, nextAction } from "@/app/lib/change-requests";
import { cn } from "@/app/lib/utils";

const PARTY_STYLE = {
  AGENCY: { icon: Building2, frame: "border-tone-info-border bg-tone-info-bg", chip: "bg-tone-info" },
  CLIENT: {
    icon: Clock,
    frame: "border-tone-caution-border bg-tone-caution-bg",
    chip: "bg-tone-caution",
  },
  NOBODY: { icon: CircleCheck, frame: "border-border bg-muted/50", chip: "bg-muted-foreground" },
};

const OUTCOME_STYLE = {
  APPROVED: {
    icon: CircleCheck,
    frame: "border-tone-positive-border bg-tone-positive-bg",
    chip: "bg-tone-positive",
  },
  REJECTED: {
    icon: TriangleAlert,
    frame: "border-tone-critical-border bg-tone-critical-bg",
    chip: "bg-tone-critical",
  },
  ON_HOLD: { icon: PauseCircle, frame: "border-border bg-muted/50", chip: "bg-muted-foreground" },
};

/**
 * The "what is this and whose turn is it" header, shared by the internal detail
 * view and the client portal. `audience` only changes the wording — the state
 * itself is derived once, in `app/lib/change-requests.js`, so the two sides can
 * never tell the client and the PM different stories.
 *
 * @param {{ request: object, audience?: 'INTERNAL' | 'CLIENT' }} props
 */
export function ChangeRequestStatusPanel({ request, audience = "INTERNAL" }) {
  const style =
    OUTCOME_STYLE[request.status] ?? PARTY_STYLE[request.awaitingParty] ?? PARTY_STYLE.NOBODY;
  const Icon = style.icon;
  const client = audience === "CLIENT";

  return (
    <section className={cn("rounded-2xl border p-4 sm:p-5", style.frame)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-white",
            style.chip,
          )}
        >
          <Icon aria-hidden="true" className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="changeRequestStatus" value={request.status} />
            {request.isOverdue ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-tone-critical px-2 py-0.5 text-[0.6875rem] font-medium text-white">
                <TriangleAlert aria-hidden="true" className="size-3" />
                Overdue
              </span>
            ) : null}
          </div>

          <p className="mt-2 font-medium text-pretty">{nextAction(request, audience)}</p>

          {request.responseDueAt && request.awaitingParty !== "NOBODY" ? (
            <p className="mt-1 text-caption opacity-80">
              {request.isOverdue ? "Was due " : "Due for a response "}
              <time dateTime={request.responseDueAt}>
                {formatRelativeDays(request.responseDueAt)}
              </time>
            </p>
          ) : null}

          {request.status === "REJECTED" && request.decisionReason ? (
            <p className="mt-2.5 rounded-lg bg-background/70 px-3 py-2 text-caption text-pretty">
              <span className="font-medium">
                {client ? "Why this didn't go ahead: " : "Reason given: "}
              </span>
              {request.decisionReason}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-current/10 pt-4 text-caption sm:grid-cols-4">
        <Impact
          label="Cost impact"
          value={
            isAssessed(request)
              ? `${request.impactCost > 0 ? "+" : ""}${formatCurrency(request.impactCost)}`
              : null
          }
          tone={request.impactCost > 0 ? "up" : request.impactCost < 0 ? "down" : "flat"}
        />
        <Impact
          label="Timeline"
          value={
            isAssessed(request)
              ? `${request.impactTimelineDays > 0 ? "+" : ""}${request.impactTimelineDays} days`
              : null
          }
          tone={
            request.impactTimelineDays > 0 ? "up" : request.impactTimelineDays < 0 ? "down" : "flat"
          }
        />
        {!client ? (
          <Impact
            label="Effort"
            value={
              request.impactHours === null || request.impactHours === undefined
                ? null
                : `${request.impactHours}h`
            }
          />
        ) : null}
        <div className="min-w-0">
          <dt className="opacity-70">{client ? "Requested for" : "Client wants it by"}</dt>
          <dd className="mt-0.5 font-medium">{formatDate(request.desiredDueDate)}</dd>
        </div>
      </dl>
    </section>
  );
}

function Impact({ label, value, tone }) {
  return (
    <div className="min-w-0">
      <dt className="opacity-70">{label}</dt>
      <dd
        className={cn(
          "tabular mt-0.5 font-medium",
          value === null && "font-normal opacity-70",
          tone === "up" && "text-tone-critical-fg",
          tone === "down" && "text-tone-positive-fg",
        )}
      >
        {value ?? (
          <span className="inline-flex items-center gap-1">
            <CircleDashed aria-hidden="true" className="size-3.5" />
            Not assessed
          </span>
        )}
      </dd>
    </div>
  );
}
