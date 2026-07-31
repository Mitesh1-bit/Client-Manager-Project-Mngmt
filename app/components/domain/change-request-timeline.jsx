import {
  CircleCheck,
  CircleDashed,
  ClipboardList,
  Inbox,
  PauseCircle,
  Rocket,
  TriangleAlert,
} from "lucide-react";

import { formatDateTime, formatRelativeDays } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

/**
 * Where a request has actually been, derived from its comments, approvals and
 * current status rather than a separate audit log (there isn't one — see
 * NEEDED_SCHEMA_CHANGES.md §8.6). Good enough to show the shape of the
 * lifecycle; a real audit trail would replace this outright.
 */
function buildEvents(request) {
  const events = [
    {
      key: "created",
      icon: Inbox,
      tone: "info",
      label: "Submitted",
      at: request.createdAt,
    },
  ];

  if (request.assessmentNotes) {
    events.push({
      key: "assessed",
      icon: ClipboardList,
      tone: "accent",
      label: "Impact assessed",
      at: request.updatedAt < request.createdAt ? request.createdAt : request.updatedAt,
    });
  }

  for (const approval of request.approvals ?? []) {
    if (approval.status === "PENDING") continue;
    events.push({
      key: `approval-${approval.id}`,
      icon: approval.status === "APPROVED" ? CircleCheck : TriangleAlert,
      tone: approval.status === "APPROVED" ? "positive" : "critical",
      label: `${approval.approverName ?? "Someone"} ${approval.status === "APPROVED" ? "approved" : "rejected"} (${approval.approverType === "INTERNAL" ? "internal" : "client"})`,
      at: approval.decidedAt,
    });
  }

  if (request.status === "ON_HOLD") {
    events.push({ key: "hold", icon: PauseCircle, tone: "neutral", label: "Parked", at: request.updatedAt });
  }
  if (request.status === "IMPLEMENTED" || request.status === "CLOSED") {
    events.push({
      key: "done",
      icon: Rocket,
      tone: "positive",
      label: request.status === "IMPLEMENTED" ? "Implemented" : "Closed",
      at: request.updatedAt,
    });
  }

  return events
    .filter((event) => Boolean(event.at))
    .sort((a, b) => new Date(a.at) - new Date(b.at));
}

const TONE_CLASSES = {
  positive: "bg-tone-positive-bg text-tone-positive-fg ring-tone-positive-border",
  critical: "bg-tone-critical-bg text-tone-critical-fg ring-tone-critical-border",
  info: "bg-tone-info-bg text-tone-info-fg ring-tone-info-border",
  accent: "bg-tone-accent-bg text-tone-accent-fg ring-tone-accent-border",
  neutral: "bg-tone-neutral-bg text-tone-neutral-fg ring-tone-neutral-border",
};

export function ChangeRequestTimeline({ request }) {
  const events = buildEvents(request);

  if (events.length === 0) {
    return (
      <p className="flex items-center gap-2 text-caption text-muted-foreground">
        <CircleDashed aria-hidden="true" className="size-4" />
        Nothing recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative">
      {events.map((event, index) => {
        const Icon = event.icon;
        const last = index === events.length - 1;
        return (
          <li key={event.key} className="relative flex gap-3 pb-4 last:pb-0">
            {!last ? (
              <span
                aria-hidden="true"
                className="absolute top-8 bottom-0 left-[0.9375rem] w-px bg-border"
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-[1.875rem] shrink-0 items-center justify-center rounded-full ring-1",
                TONE_CLASSES[event.tone],
              )}
            >
              <Icon aria-hidden="true" className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-caption">{event.label}</p>
              <p
                className="text-[0.75rem] text-muted-foreground"
                title={formatDateTime(event.at)}
              >
                {formatRelativeDays(event.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
