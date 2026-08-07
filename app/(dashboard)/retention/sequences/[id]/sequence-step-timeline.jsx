import { channelIcon, channelLabel } from "@/app/lib/channels";

const ROLE_LABELS = {
  ACCOUNT_MANAGER: "Account manager",
  PROJECT_MANAGER: "Project manager",
  ADMIN: "Admin",
  TEAM_MEMBER: "Team member",
  FINANCE_ADMIN: "Finance admin",
  VIEWER: "Viewer",
};

/** Read-only view of a sequence's steps, in day order. */
export function SequenceStepTimeline({ steps }) {
  const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <ol className="relative">
      {sorted.map((step, index) => {
        const Icon = channelIcon(step.channel);
        const last = index === sorted.length - 1;

        return (
          <li key={step.id} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last ? (
              <span
                aria-hidden="true"
                className="absolute top-9 bottom-0 left-[1.0625rem] w-px bg-border"
              />
            ) : null}

            <span className="relative z-10 flex size-[2.125rem] shrink-0 items-center justify-center rounded-full bg-tone-accent-bg text-tone-accent-fg ring-1 ring-tone-accent-border">
              <Icon aria-hidden="true" className="size-4" />
            </span>

            <div className="min-w-0 flex-1 pt-1">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium text-pretty">{step.name || `Step ${index + 1}`}</span>
                <span className="tabular text-caption text-muted-foreground">
                  Day {step.offsetDays}
                </span>
              </p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                {channelLabel(step.channel)}
                {step.assigneeRole ? ` · ${ROLE_LABELS[step.assigneeRole] ?? step.assigneeRole}` : ""}
                {step.templateId ? ` · template ${step.templateId}` : ""}
              </p>
              {step.actionMessage ? (
                <p className="mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-caption text-pretty text-muted-foreground">
                  {step.actionMessage}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
