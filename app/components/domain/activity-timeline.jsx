import {
  Building2,
  CalendarClock,
  CircleCheck,
  FileText,
  FolderKanban,
  GitPullRequestArrow,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { formatDateTime, formatRelativeDays, initials } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

/**
 * Icon and tone per audit action. Prefix match, so `change_request.approved`
 * and `change_request.rejected` both fall back to the `change_request.` entry
 * unless they're listed explicitly.
 */
const ACTIONS = [
  ["company.created", { icon: Building2, tone: "accent" }],
  ["company.status_changed", { icon: Pencil, tone: "caution" }],
  ["company.updated", { icon: Pencil, tone: "neutral" }],
  ["contact.created", { icon: UserPlus, tone: "accent" }],
  ["contact.archived", { icon: Users, tone: "neutral" }],
  ["contact.updated", { icon: Pencil, tone: "neutral" }],
  ["portal.invited", { icon: ShieldCheck, tone: "info" }],
  ["note.added", { icon: MessageSquare, tone: "neutral" }],
  ["document.uploaded", { icon: FileText, tone: "info" }],
  ["health_score.recalculated", { icon: TrendingUp, tone: "info" }],
  ["project.health_changed", { icon: FolderKanban, tone: "caution" }],
  ["project.", { icon: FolderKanban, tone: "accent" }],
  ["change_request.approved", { icon: CircleCheck, tone: "positive" }],
  ["change_request.rejected", { icon: GitPullRequestArrow, tone: "critical" }],
  ["change_request.pending_approval", { icon: GitPullRequestArrow, tone: "caution" }],
  ["change_request.", { icon: GitPullRequestArrow, tone: "info" }],
  ["touchpoint.completed", { icon: CircleCheck, tone: "positive" }],
  ["touchpoint.overdue", { icon: CalendarClock, tone: "critical" }],
  ["touchpoint.scheduled", { icon: CalendarClock, tone: "info" }],
  ["touchpoint.", { icon: Phone, tone: "neutral" }],
];

const TONE_CLASSES = {
  positive: "bg-tone-positive-bg text-tone-positive-fg ring-tone-positive-border",
  caution: "bg-tone-caution-bg text-tone-caution-fg ring-tone-caution-border",
  critical: "bg-tone-critical-bg text-tone-critical-fg ring-tone-critical-border",
  info: "bg-tone-info-bg text-tone-info-fg ring-tone-info-border",
  neutral: "bg-tone-neutral-bg text-tone-neutral-fg ring-tone-neutral-border",
  accent: "bg-tone-accent-bg text-tone-accent-fg ring-tone-accent-border",
};

function entryMeta(action) {
  const match = ACTIONS.find(([prefix]) => action === prefix || action.startsWith(prefix));
  return match?.[1] ?? { icon: Mail, tone: "neutral" };
}

/**
 * The unified activity feed for a company or contact — audit rows, touchpoints,
 * change requests and projects in one chronological list.
 *
 * @param {{ entries: Array<{ id: string, action: string, summary: string, actorName?: string | null, createdAt: string }>, limit?: number, className?: string }} props
 */
export function ActivityTimeline({ entries, limit, className }) {
  const visible = limit ? entries.slice(0, limit) : entries;

  return (
    <ol className={cn("relative", className)}>
      {visible.map((entry, index) => {
        const meta = entryMeta(entry.action);
        const Icon = meta.icon;
        const last = index === visible.length - 1;

        return (
          <li key={entry.id} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last ? (
              <span
                aria-hidden="true"
                className="absolute top-9 bottom-0 left-[1.0625rem] w-px bg-border"
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 flex size-[2.125rem] shrink-0 items-center justify-center rounded-full ring-1",
                TONE_CLASSES[meta.tone],
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
            </span>

            <div className="min-w-0 flex-1 pt-1">
              <p className="text-caption text-pretty">{entry.summary}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.75rem] text-muted-foreground">
                {entry.actorName ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="flex size-4 items-center justify-center rounded-full bg-muted text-[0.5625rem] font-medium"
                    >
                      {initials(entry.actorName)}
                    </span>
                    {entry.actorName}
                  </span>
                ) : null}
                <time dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)}>
                  {formatRelativeDays(entry.createdAt)}
                </time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
